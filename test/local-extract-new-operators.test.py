import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import struct
import sys
import tempfile
from types import SimpleNamespace as NS
import unittest
from unittest.mock import patch
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools/local-extract'))
import client_flatbuffers as fb
import new_operators as new
import recovery_models as models

TAL = 'char_9991_talulah'
LAND = 'char_9992_land'
TOSKA = 'char_9993_frost'
TOKEN = 'token_9991_anchor'
TOKEN2 = 'token_9992_child'


def tables():
    return {**{name: {} for name in new.TABLES},
            'character_table': {TAL: {'name': '塔露拉', 'skills': [{'skillId': 'skchr_tal_1'}], 'displayTokenDict': {TOKEN: True}},
                                LAND: {'name': '国度', 'skills': []}, TOSKA: {'name': '冻河', 'skills': None},
                                TOKEN: {'name': 'anchor', 'skills': [{'skillId': 'skchr_token'}]}, TOKEN2: {'name': 'child'},
                                'char_9994_other': {'name': 'other'}, 'char_9995_talulahish': {'name': 'Talulahish'}},
            'skill_table': {'skchr_tal_1': {'levels': [{'rangeId': 'range_a', 'tokenId': TOKEN2, 'iconId': 'skill_tal'}]},
                            'skchr_token': {'iconId': 'token_skill'}},
            'range_table': {'range_a': {'grids': []}, 'unrelated': {}},
            'skin_table': {'charSkins': {'base': {'charId': TAL, 'avatarId': TAL, 'portraitId': TAL+'_1'},
                                        'skin': {'charId': TAL, 'avatarId': TAL+'_skin', 'portraitId': TAL+'_skin_1', 'voiceId': 'char_9991_talulah_skin'},
                                        'other': {'charId': 'char_9994_other'}}},
            'uniequip_table': {'equipDict': {'equip_tal': {'charId': TAL, 'uniEquipIcon': 'module_tal'}, 'other': {'charId': 'char_9994_other'}}, 'charEquip': {TAL: ['equip_tal']}},
            'battle_equip_table': {'equip_tal': {'phases': [{'token': TOKEN2}]}, 'other': {}},
            'charword_table': {'charWords': {TAL+'_CN_001': {'charId': TAL, 'voiceId': TAL}}}}


class Planning(unittest.TestCase):
    def test_tables_in_opaque_bundle_are_scanned_and_inventory_retained(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); game = root/'view'; game.mkdir()
            bundle = game/'pkgrps'/'opaque_123.ab'; bundle.parent.mkdir(); bundle.write_bytes(b'fixture')
            obj = NS(type=NS(name='TextAsset'), read=lambda:NS(m_Name='character_table', m_Script=json.dumps({TAL:{'name':'塔露拉'}}).encode()))
            messages = []
            with patch.dict(sys.modules, {'aklz4':NS(), 'UnityPy':NS(load=lambda p:NS(objects=[obj]))}):
                values, report = new.load_tables(game, root/'out', log=messages.append)
            self.assertIn(TAL, values['character_table'])
            self.assertEqual(report['sources']['character_table']['bundle'], 'pkgrps/opaque_123.ab')
            self.assertEqual(new.read(root/'out/tables/bundle-inventory.json'), ['pkgrps/opaque_123.ab'])
            self.assertTrue(any('Missing required' in m for m in messages))

    def test_nested_installed_loose_tables_outside_old_excel_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); game = root/'view'; game.mkdir()
            folder = root/'install/Arknights_Data/PersistentData/new-layout/data'
            folder.mkdir(parents=True)
            (folder/'character_table.bytes').write_text(json.dumps({TAL:{'name':'塔露拉'}}))
            values, _ = new.load_tables(game, root/'out', installed=root/'install', log=lambda s:None)
            self.assertIn(TAL, values['character_table'])

    def test_encrypted_json_and_bson_tables(self):
        try:
            from Crypto.Cipher import AES
            from Crypto.Util.Padding import pad
            from bson import BSON
        except ImportError:
            self.skipTest('optional client AES/BSON dependencies are not installed')
        value = {'fixture': {'name': '冻河', 'number': 74}}
        mask = b'UITpAi82pHAWwnzqHRMCwPonJLIB3WCl'
        salt = bytes(range(16))
        iv = bytes(a ^ b for a, b in zip(salt, mask[16:]))
        for data in (json.dumps(value).encode(), BSON.encode(value)):
            encrypted = b'X'*128 + salt + AES.new(mask[:16], AES.MODE_CBC, iv).encrypt(pad(data, 16))
            self.assertEqual(new.decode_table(encrypted), value)
            with self.assertRaises(ValueError): new.decode_table(encrypted[:-1])

    def test_anonymous_container_path_identifies_stripped_table_name(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); game = root/'view'; (game/'anon').mkdir(parents=True)
            (game/'anon/hash.bin').write_bytes(b'raw opaque fixture')
            obj = NS(path_id=7, type=NS(name='TextAsset'), read=lambda:NS(m_Name='stripped', m_Script=b'{"fixture":{}}'))
            env = NS(objects=[obj], container={'assets/gamedata/excel/character_table.bytes':NS(path_id=7)})
            with patch.dict(sys.modules, {'aklz4':NS(), 'UnityPy':NS(load=lambda p:env)}):
                values, _ = new.load_tables(game, root/'out', log=lambda s:None)
            self.assertEqual(values['character_table'], {'fixture':{}})
            self.assertEqual((root/'out/tables/opaque-bundles/hash.bin').read_bytes(), b'raw opaque fixture')
            self.assertEqual(new.read(root/'out/tables/opaque-inspection.json')[0]['objects'][0]['name'], 'stripped')

    def test_hashed_table_names_are_strictly_identified(self):
        for name in new.TABLES:
            self.assertEqual(new.table_name(name+'c913b6'), name)
            self.assertEqual(new.table_name('dyn/gamedata/excel/'+name+'aB12cD.bytes'), name)
            self.assertEqual(new.table_name(name+'.json'), name)
            for suffix in ('_unrelated', 'c913b6extra', 'zzzzzz', 'c913b'):
                self.assertIsNone(new.table_name(name+suffix))

    def test_bundled_flatbuffers_schemas_parse(self):
        for name in new.TABLES:
            if name != 'range_table':
                root, enums, tables = fb.schema(name)
                self.assertIn(root, tables)
                self.assertGreater(len(tables), 0)

    def test_flatbuffers_strings_enum_vector_and_defaults(self):
        data = bytearray(84)
        for pos, fmt, value in [(0,'I',24),(8,'H',10),(10,'H',16),(12,'H',4),(14,'H',8),(16,'H',12),
                                (24,'i',16),(28,'I',20),(32,'i',5),(36,'I',28),(48,'I',5),
                                (64,'I',3),(68,'i',-2),(72,'i',0),(76,'i',7)]:
            struct.pack_into('<'+fmt,data,pos,value)
        data[52:58] = b'hello\0'
        layout = ('Root', {'Mode':('int',{0:'NONE',5:'ACTIVE'})},
                  {'Root':[('name','string',None),('mode','Mode',None),('nums','[int]',None),('missing','string',None),('flag','bool',None)]})
        with patch.object(fb,'schema',return_value=layout):
            self.assertEqual(fb.decode(b'X'*128+data,'fixture'),
                             {'name':'hello','mode':'ACTIVE','nums':[-2,0,7],'missing':None,'flag':False})
            with self.assertRaises(ValueError): fb.decode(b'X'*128+data[:-10],'fixture')
            broken=bytearray(data);struct.pack_into('<I',broken,28,100000)
            with self.assertRaises(ValueError): fb.decode(b'X'*128+broken,'fixture')

    def test_flatbuffers_dictionary_wrapper_and_schema_mismatch(self):
        data=bytearray(128)
        for pos,fmt,value in [(0,'I',24),(8,'H',6),(10,'H',8),(12,'H',4),(24,'i',16),(28,'I',20),
                              (48,'I',2),(52,'I',28),(56,'I',48),(64,'H',8),(66,'H',12),(68,'H',4),(70,'H',8),
                              (80,'i',16),(84,'i',1),(88,'f',1.5),(104,'i',40),(108,'i',2),(112,'f',-2.25)]:
            struct.pack_into('<'+fmt,data,pos,value)
        layout=('Root',{}, {'Root':[('characters','[Entry]',None)],'Entry':[('key','int',None),('value','float',None)]})
        with patch.object(fb,'schema',return_value=layout):
            self.assertEqual(fb.decode(b'X'*128+data,'character_table'),{'1':1.5,'2':-2.25})
            duplicate=bytearray(data);struct.pack_into('<i',duplicate,108,1)
            with self.assertRaisesRegex(ValueError,'Duplicate'): fb.decode(b'X'*128+duplicate,'character_table')
        layout=('Root',{}, {'Root':[]})
        with patch.object(fb,'schema',return_value=layout):
            with self.assertRaisesRegex(ValueError,'fewer fields'): fb.decode(b'X'*128+data,'fixture')

    def test_updated_hashed_bundle_wins_over_differently_named_base(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); game = root/'view'; (game/'anon').mkdir(parents=True)
            for file in ('aaa.bin','zzz.bin'): (game/'anon'/file).write_bytes(b'fixture')
            new.write(game/'client-bundle-sources.json', {'anon/aaa.bin':'base','anon/zzz.bin':'update'})
            def load(path):
                value = 'old' if Path(path).name == 'aaa.bin' else 'new'
                obj=NS(type=NS(name='TextAsset'), read=lambda:NS(m_Name='character_tablec913b6',m_Script=json.dumps({'fixture':{'name':value}}).encode()))
                return NS(objects=[obj])
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=load)}):
                values, report=new.load_tables(game,root/'out',log=lambda s:None)
            self.assertEqual(values['character_table']['fixture']['name'],'new')
            self.assertEqual(report['sources']['character_table']['origin'],'update')

    def test_prepared_view_records_base_and_update_provenance(self):
        spec=importlib.util.spec_from_file_location('new_ops_prepare',ROOT/'tools/local-extract/prepare_client.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);base=root/'base';updates=root/'updates'
            for directory in (base,updates): (directory/'anon').mkdir(parents=True)
            (base/'battle/prefabs/effects').mkdir(parents=True)
            (base/'battle/prefabs/effects/test.ab').write_bytes(b'effect')
            (base/'anon/shared.bin').write_bytes(b'base');(updates/'anon/shared.bin').write_bytes(b'new')
            (updates/'anon/updated.bin').write_bytes(b'new')
            module.prepare(base,updates,root/'view')
            provenance=new.read(root/'view/client-bundle-sources.json')
            self.assertEqual(provenance['anon/shared.bin'],'update')
            self.assertEqual(provenance['anon/updated.bin'],'update')
            self.assertEqual(provenance['battle/prefabs/effects/test.ab'],'base')
            self.assertEqual((root/'view/anon/shared.bin').read_bytes(),b'new')
            self.assertEqual((base/'anon/shared.bin').read_bytes(),b'base')

    def test_upload_package_omits_recovery_ab_but_preserves_all_converted_resources(self):
        import package_operators
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);output=root/'extraction'
            content={'operator-report.json':b'{"complete":true}', 'files.json':b'[]',
                     'source-bundles/common.ab':b'raw recovery', 'source-bundles/source-report.json':b'{}',
                     'models/operator/model.json':b'{"model":1}', 'base-fx/fx/prefabs/skill.json':b'{}',
                     'audio/sfx/clip.wav':b'clip', 'tables/raw/character.bin':b'raw table'}
            for rel, data in content.items():
                p=output/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
            package_operators.package(output, archive=root/'upload.zip')
            with zipfile.ZipFile(root/'upload.zip') as z:
                self.assertNotIn('extraction/source-bundles/common.ab',z.namelist())
                self.assertIn('extraction/source-bundles/source-report.json',z.namelist())
                for rel in content:
                    if rel not in ('source-bundles/common.ab','files.json'):
                        self.assertEqual(z.read('extraction/'+rel),content[rel])
                manifest=json.loads(z.read('extraction/upload-manifest.json'))
                self.assertEqual(manifest['omittedBytes'],len(b'raw recovery'))
                inventory=json.loads(z.read('extraction/files.json'))
                self.assertNotIn('source-bundles/common.ab',[r['path'] for r in inventory])
            for rel,data in content.items(): self.assertEqual((output/rel).read_bytes(),data)
            package_operators.package(output,include_sources=True,archive=root/'full.zip')
            with zipfile.ZipFile(root/'full.zip') as z:
                self.assertEqual(z.read('extraction/source-bundles/common.ab'),b'raw recovery')
            with self.assertRaises(ValueError): package_operators.package(output,archive=output/'bad.zip')
            with self.assertRaises(ValueError): package_operators.package(output,archive=root/'full.zip')

    def test_voice_line_ids_do_not_become_speaker_owners(self):
        source=tables();p=new.make_plan(source,new.DEFAULT_TARGETS)
        source['charword_table']['charWords'][TAL+'_CN_001']={'charId':TAL,'wordKey':TAL,'charWordId':TAL+'_CN_001','voiceId':'CN_001','voiceAsset':TAL+'/CN_001'}
        self.assertNotIn(TAL+'_CN_001',new.voice_owners(source,p))
        self.assertIn(TAL,new.voice_owners(source,p))

    def test_unity_container_pointers_are_dereferenced_for_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);game=root/'game';(game/'audio').mkdir(parents=True);(game/'audio/test.ab').write_bytes(b'fixture')
            sf=NS(name='CAB-fixture'); obj=NS(path_id=1,assets_file=sf,type=NS(name='AudioClip'),read=lambda:NS(m_Name='CN_001',samples={'CN_001.wav':b'voice'}))
            pointer=NS(deref=lambda:obj)  # PPtr deliberately has no assets_file.
            env=NS(objects=[obj],container={'voice/'+TAL+'/CN_001':pointer})
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=lambda p:env)}):
                report=new.export_audio(game,root/'out',{'banks':[]},{TAL},lambda s:None)
            self.assertFalse(report['errors']);self.assertFalse(report['missingVoiceOwners'])
            self.assertEqual(len(report['files']),1)

    def test_skill_icon_prefix_matches_requested_skill_id(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);game=root/'game';(game/'spritepack').mkdir(parents=True);(game/'spritepack/skill_icons_0.ab').write_bytes(b'fixture')
            image=NS(width=1,height=1,save=lambda p:Path(p).write_bytes(b'png fixture'))
            item=NS(m_Name='skill_icon_skchr_tal_1',image=image)
            obj=NS(type=NS(name='Sprite'),read=lambda:item)
            plan={'sprites':['skchr_tal_1'],'requiredSprites':['skchr_tal_1']}
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=lambda p:NS(objects=[obj]))}):
                report=new.export_sprites(game,root/'out',plan,lambda s:None)
            self.assertFalse(report['missingRequired']);self.assertEqual(report['sprites'][0]['name'],'skill_icon_skchr_tal_1')

    def test_initial_module_badge_is_not_required_as_a_unique_module_image(self):
        source=tables();source['uniequip_table']['equipDict']['equip_default']={'charId':TAL,'type':'INITIAL','uniEquipIcon':'equip_default'}
        source['uniequip_table']['charEquip'][TAL].append('equip_default')
        plan=new.make_plan(source,new.DEFAULT_TARGETS)
        self.assertIn('equip_default',plan['tables']['modules'])
        self.assertNotIn('equip_default',plan['requiredSprites'])
        self.assertIn('module_tal',plan['requiredSprites'])

    def test_real_unitypy_pptr_audio_container_api(self):
        try: from UnityPy.classes.PPtr import PPtr
        except ImportError: self.skipTest('UnityPy is not installed in the test interpreter')
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);game=root/'game';(game/'audio').mkdir(parents=True);(game/'audio/test.ab').write_bytes(b'fixture')
            sf=NS(name='CAB-real-pptr',objects={})
            obj=NS(path_id=1,assets_file=sf,type=NS(name='AudioClip'),read=lambda:NS(m_Name='CN_001',samples={'CN_001.wav':b'voice'}))
            sf.objects[1]=obj;pointer=PPtr(m_FileID=0,m_PathID=1,assetsfile=sf)
            self.assertFalse(hasattr(pointer,'assets_file'))
            env=NS(objects=[obj],container={'voice/'+TAL+'/CN_001':pointer})
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=lambda p:env)}):
                report=new.export_audio(game,root/'out',{'banks':[]},{TAL},lambda s:None)
            self.assertEqual(len(report['files']),1);self.assertFalse(report['errors'])

    def test_media_repair_uses_matching_run_and_preserves_original_output(self):
        import repair_operator_media as repair
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);original=root/'cn-operators-20261101-fixture';original.mkdir()
            new.write(original/'operator-report.json',{'requested':new.DEFAULT_TARGETS})
            for name,value in tables().items():new.write(original/'tables/client'/(name+'.json'),value)
            new.write(original/'audio-banks.json',{'banks':[]})
            model=original/'models/keep.json';new.write(model,{'unchanged':True})
            with self.assertRaises(ValueError):repair.repair(original,output=root/'no-client')
            game=root/'work/cn-client-20261101-fixture';game.mkdir(parents=True)
            before={p.relative_to(original).as_posix():p.read_bytes() for p in original.rglob('*') if p.is_file()}
            def icons(game,output,plan,log):
                new.write(output/'sprites.json',{'sprites':[]});return {'sprites':[],'missingRequired':[],'errors':[]}
            def audio(game,output,banks,owners,log):
                new.write(output/'audio-report.json',{'files':[]});return {'files':[],'missingSfx':[],'missingVoiceOwners':[],'errors':[]}
            with patch.object(repair,'export_sprites',side_effect=icons),patch.object(repair,'export_audio',side_effect=audio):
                report=repair.repair(original,output=root/'followup',log=lambda s:None)
            self.assertTrue(report['complete'])
            self.assertEqual(before,{p.relative_to(original).as_posix():p.read_bytes() for p in original.rglob('*') if p.is_file()})
            self.assertFalse((root/'followup/models').exists())

    def test_default_targets_are_three_people_and_both_frozen_river_names_resolve_identically(self):
        self.assertEqual(new.DEFAULT_TARGETS, ['塔露拉', '国度', '冻河'])
        self.assertEqual(new.select_targets(tables()['character_table'], new.DEFAULT_TARGETS), ([TAL, LAND, TOSKA], []))
        for alias in ['Talulah', 'talulah', TAL]: self.assertEqual(new.select_targets(tables()['character_table'], [alias]), ([TAL], []))
        self.assertEqual(new.select_targets(tables()['character_table'], ['Территория', 'Тоска']), ([LAND, TOSKA], []))
        self.assertEqual(new.select_targets(tables()['character_table'], ['missing']), ([], ['missing']))

    def test_dependency_closure_keeps_all_owned_skins_modules_ranges_tokens_and_no_unrelated_operator(self):
        p = new.make_plan(tables(), new.DEFAULT_TARGETS)
        self.assertEqual(set(p['units']), {TAL, LAND, TOSKA, TOKEN, TOKEN2})
        self.assertEqual(set(p['tables']['modules']), {'equip_tal'})
        self.assertEqual(set(p['tables']['ranges']), {'range_a'})
        self.assertEqual({s['skinId'] for s in p['skins']}, {'base', 'skin'})
        self.assertIn('skill_tal', p['requiredSprites']); self.assertIn('module_tal', p['requiredSprites'])
        self.assertEqual(p['missingSkills'], [])
        self.assertEqual(new.voice_owners(tables(), p), {TAL, LAND, TOSKA, 'char_9991_talulah_skin'})

    def test_patch_forms_are_included_from_the_owner_info_not_an_unrelated_operator(self):
        t = tables(); t['char_patch_table'] = {'infos': {TAL: {'tmplIds': ['char_9996_form']}, LAND: {}},
                'patchChars': {'char_9996_form': {'name': 'form', 'skills': []}, 'char_9997_unrelated': {'name': 'unrelated'}}}
        p = new.make_plan(t, ['塔露拉']); self.assertIn('char_9996_form', p['units']); self.assertNotIn('char_9997_unrelated', p['units'])

    def test_declared_missing_skill_is_reported(self):
        t = tables(); del t['skill_table']['skchr_tal_1']
        self.assertEqual(new.make_plan(t, ['塔露拉'])['missingSkills'], ['skchr_tal_1'])

    def test_client_encodings_and_unsupported_bytes(self):
        value = {'名字': 'Тоска'}
        for payload in [json.dumps(value, ensure_ascii=False).encode('utf-8-sig'), json.dumps(value).encode('utf-16'),
                        gzip.compress(json.dumps(value).encode()), zlib.compress(json.dumps(value).encode())]:
            self.assertEqual(new.decode_table(payload), value)
        with self.assertRaisesRegex(ValueError, 'raw bytes retained'): new.decode_table(b'opaque-new-format')
        self.assertEqual(new.table_name(r'GameData\Excel\CHARACTER_TABLE.bytes'), 'character_table')

    def test_packed_token_models_are_discovered_without_their_id_in_the_bundle_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); a = root/'charpack'/ (TAL+'.ab'); a.parent.mkdir(); a.touch()
            b = root/'pkgrps/btl_pfb_tokens_004.ab'; b.parent.mkdir(); b.touch()
            self.assertEqual(models.model_jobs(root, [], [TAL, TOKEN], {TOKEN: 'pkgrps/btl_pfb_tokens_004.ab'}), [a, b])
            self.assertEqual(models.model_owner('pkgrps/btl_pfb_tokens_004.ab', 'assets/tokens/'+TOKEN+'.prefab', [TOKEN]), TOKEN)
            self.assertIsNone(models.model_owner('chararts/'+TAL+'.ab', 'assets/other.prefab', [TAL]))

    def test_cross_output_effect_references_are_valid_but_missing_payloads_are_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder, key, refs in [('base', 'a', ['b']), ('skin', 'b', [])]:
                new.write(root/folder/'fx/index.json', {'prefabs': {key: {'file': key+'.json', 'refs': refs}}})
                (root/folder/'fx'/(key+'.json')).write_text('{}')
            self.assertEqual(new.check_fx(root), [])
            (root/'skin/fx/b.json').unlink(); self.assertTrue(new.check_fx(root))


class ExtractionContracts(unittest.TestCase):
    def test_local_only_planning_packages_three_targets_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); game = root/'game'; game.mkdir(); (game/'keep.bin').write_bytes(b'never modify')
            local = root/'本地表'; local.mkdir()
            for name, value in tables().items(): new.write(local/(name+'.json'), value)
            kit = root/'kit'; kit.mkdir(); output = root/'result'
            report = new.run(kit, game, output, new.DEFAULT_TARGETS, supplied=local, plan_only=True, log=lambda s: None)
            self.assertFalse(report['complete']); self.assertTrue(report['planOnly']); self.assertFalse(report['onlineTablesUsed'])
            self.assertEqual(report['operators'], [TAL, LAND, TOSKA]); self.assertEqual(report['tableReport']['missingRequired'], [])
            self.assertEqual((game/'keep.bin').read_bytes(), b'never modify')
            self.assertTrue(output.with_suffix('.zip').is_file())
            with self.assertRaisesRegex(ValueError, 'fresh output'): new.run(kit, game, output, [], supplied=local)
            with self.assertRaisesRegex(ValueError, 'outside'): new.run(kit, game, game/'bad', [], supplied=local)

    def test_updated_loose_client_tables_win_over_streaming_assets(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); local = root/'install'; game = root/'view'; game.mkdir()
            base = local/'Arknights_Data/StreamingAssets/gamedata/excel'; update = local/'Arknights_Data/PersistentData/gamedata/excel'
            for name, value in tables().items(): new.write(base/(name+'.json'), value)
            new.write(update/'character_table.json', {TAL: {'name': 'newest'}})
            values, report = new.load_tables(game, root/'out', installed=local)
            self.assertEqual(values['character_table'], {TAL: {'name': 'newest'}}); self.assertFalse(report['onlineTablesUsed'])

    def test_updated_bundle_table_wins_over_a_loose_base_table(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);game=root/'view';(game/'gamedata').mkdir(parents=True);(game/'gamedata/excel.ab').touch()
            base=root/'install/Arknights_Data/StreamingAssets/gamedata/excel'
            for name,value in tables().items():new.write(base/(name+'.json'),value)
            obj=NS(type=NS(name='TextAsset'),read=lambda:NS(m_Name='character_table',m_Script=json.dumps({TAL:{'name':'newest'}}).encode()))
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=lambda p:NS(objects=[obj]))}):
                values,report=new.load_tables(game,root/'out',installed=root/'install',log=lambda s:None)
            self.assertEqual(values['character_table'],{TAL:{'name':'newest'}})
            self.assertEqual(report['sources']['character_table']['source'],'client-TextAsset')

    def test_unreadable_update_never_silently_uses_an_older_base_table(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);game=root/'view';game.mkdir()
            base=root/'install/Arknights_Data/StreamingAssets/gamedata/excel'
            for name,value in tables().items():new.write(base/(name+'.json'),value)
            update=root/'install/Arknights_Data/PersistentData/gamedata/excel/character_table.bytes'
            update.parent.mkdir(parents=True);update.write_bytes(b'new opaque format')
            values,report=new.load_tables(game,root/'out',installed=root/'install')
            self.assertNotIn('character_table',values);self.assertIn('character_table',report['missingRequired']);self.assertTrue(report['errors'])

    def test_unsupported_embedded_table_is_retained_and_reported(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); game=root/'view'; (game/'gamedata').mkdir(parents=True); (game/'gamedata/tables.ab').touch()
            obj=NS(type=NS(name='TextAsset'),read=lambda:NS(m_Name='character_table',m_Script=b'unknown latest format'))
            with patch.dict(sys.modules, {'aklz4': NS(), 'UnityPy': NS(load=lambda p:NS(objects=[obj]))}):
                values, report=new.load_tables(game,root/'out',log=lambda s:None)
            self.assertFalse(values); self.assertIn('character_table',report['missingRequired']); self.assertTrue(report['errors'])
            self.assertEqual(next((root/'out/tables/raw').glob('*.bin')).read_bytes(),b'unknown latest format')

    def test_voice_clips_with_shared_names_do_not_leak_from_other_operators(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); game=root/'game'; (game/'audio').mkdir(parents=True); (game/'audio/shared.ab').touch()
            sf=object()
            def clip(pid,name):return NS(type=NS(name='AudioClip'),path_id=pid,assets_file=sf,read=lambda:NS(m_Name=name,samples={name+'.wav':name.encode()}))
            own=clip(1,'CN_001'); other=clip(2,'CN_001'); sfx=clip(3,'p_atk_tal')
            env=NS(objects=[own,other,sfx],container={'voice/'+TAL+'/CN_001':own,'voice/char_888_other/CN_001':other,'player/p_atk_tal':sfx})
            banks={'banks':[{'sounds':[{'asset':'Audio/Player/p_atk_tal'}]}]}
            with patch.dict(sys.modules,{'aklz4':NS(),'UnityPy':NS(load=lambda p:env)}):
                report=new.export_audio(game,root/'out',banks,{TAL},lambda s:None)
            self.assertEqual(len(report['files']),2); self.assertEqual([r['owners'] for r in report['files'] if r['kind']=='voice'],[[TAL]])
            self.assertEqual(report['missingSfx'],[]); self.assertEqual(report['missingVoiceOwners'],[])

    def test_raw_bundle_dependency_cycles_terminate_without_modifying_the_client(self):
        import fx
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); game=root/'game'; game.mkdir(); (game/'a.ab').write_bytes(b'a'); (game/'b.ab').write_bytes(b'b')
            dependencies={'a.ab':[NS(path='archive:/CAB-b')], 'b.ab':[NS(path='CAB-a'),NS(path='unity_builtin_extra')]}
            fake_env=NS(load_rel=lambda rel:[NS(externals=dependencies[rel])])
            with patch.object(fx,'scan_cabs',return_value={'cab-a':str(game/'a.ab'),'cab-b':str(game/'b.ab')}),patch.object(fx,'AssetEnv',return_value=fake_env):
                report=new.copy_sources(game,root/'out',{'a.ab'},lambda s:None)
            self.assertEqual({r['path'] for r in report['files']},{'a.ab','b.ab'}); self.assertEqual(report['missingDependencies'],[])
            self.assertEqual((game/'a.ab').read_bytes(),b'a')

    def test_standalone_zip_has_every_import_and_unicode_safe_launcher(self):
        spec=importlib.util.spec_from_file_location('newkit',ROOT/'tools/build-cn-new-operators-kit.py'); builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
        with tempfile.TemporaryDirectory() as tmp:
            archive=builder.build(Path(tmp)/'kit.zip')
            with zipfile.ZipFile(archive) as z:
                for name in builder.MODULES:self.assertIn('tools/local-extract/'+name,z.namelist())
                self.assertIn('tools/local-extract/plugin-fx.mjs',z.namelist()); self.assertIn('prepare_client.py',z.namelist())
                self.assertIn('tools/local-extract/client_flatbuffers.py', z.namelist())
                self.assertIn('tools/local-extract/cn-schemas/character_table.fbs', z.namelist())
                self.assertIn('tools/local-extract/cn-schemas/SOURCES.json', z.namelist())
                ps=z.read('EXTRACT-NEW-OPERATORS.ps1');self.assertTrue(ps.startswith(b'\xef\xbb\xbf'))
                launcher=ps.decode('utf-8-sig');self.assertIn('new_operators.py',launcher);self.assertNotIn("-Filter 'cn-client-*'",launcher)
                self.assertIn("'--tables'",launcher);self.assertIn("'--operator'",launcher)
                self.assertEqual(len(json.loads(z.read('targets.json'))['targets']),3)
                z.extractall(tmp)
            result=subprocess.run([sys.executable,str(Path(tmp)/'tools/local-extract/new_operators.py'),'--help'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr);self.assertIn('--operator',result.stdout)
            # Execute the packaged --client path, including its root-level prepare_client import.
            install=Path(tmp)/'cn-game'; bundle=install/'Arknights_Data/StreamingAssets/AB/Windows/pkgrps/btl_pfb_fx_001.ab'
            bundle.parent.mkdir(parents=True);bundle.write_bytes(b'read-only fixture')
            local=Path(tmp)/'latest-excel'
            for name,value in tables().items():new.write(local/(name+'.json'),value)
            output=Path(tmp)/'extraction'
            r=subprocess.run([sys.executable,str(Path(tmp)/'tools/local-extract/new_operators.py'),'--client',str(install),'--tables',str(local),'--plan-only','--out',str(output)],capture_output=True,text=True)
            self.assertEqual(r.returncode,2,r.stdout+r.stderr)
            self.assertEqual(new.read(output/'operator-report.json')['operators'],[TAL,LAND,TOSKA])
            self.assertEqual(bundle.read_bytes(),b'read-only fixture')



if __name__=='__main__':unittest.main()
