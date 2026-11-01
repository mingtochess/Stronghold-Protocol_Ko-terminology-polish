import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace as NS
import unittest
from unittest.mock import patch
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'tools/local-extract'))
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
