"""Build the standalone Windows extraction kit for client-only unreleased operators."""
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MODULES = ['new_operators.py', 'repair_operator_media.py', 'package_operators.py', 'client_flatbuffers.py', 'recovery_models.py', 'skin_fx.py', 'complete_skin_fx.py',
           'skin_recovery.py', 'skin_audio.py', 'cn_skins.py', 'fx.py', 'aklz4.py',
           'extract.py', 'operators.py', 'scenes.py', 'requirements.txt', 'LICENSE-Ark-Unpacker.txt']

README = '''중국 클라이언트 신규 선발 오퍼레이터 추출 도구

이미 추출을 완료한 경우 package_operators.py로 재압축만 할 수 있습니다.
업로드 ZIP에서는 source-bundles 원본 AB를 제외하며, 원본은 PC에 그대로 보관합니다.

기본 대상은 세 명입니다.
- 塔露拉 / Talulah
- 国度 / Территория
- 冻河 / Тоска (동일한 한 명)
이름은 클라이언트 데이터에서 실제 charId로 해결합니다.
해시 접미사가 붙은 테이블 이름과 CN FlatBuffers/AES JSON/BSON을 로컬에서 해독합니다.
기존 뷰 대신 일반 실행으로 새 뷰를 준비해야 업데이트 테이블 출처가 기록됩니다. 오퍼레이터 ID를 추측해서 고정하지 않습니다.

준비
1. 중국 PC 클라이언트를 업데이트하고 필요한 음성/스킨 리소스를 다운로드합니다.
2. 클라이언트와 같은 NTFS 드라이브의 별도 폴더에 이 ZIP을 풉니다. 예: D:\\ak-new-operators
   게임 설치 폴더 안에 넣지 마세요. 작업용 하드링크를 만들기 때문에 같은 드라이브가 필요합니다.
3. PowerShell에서 다음 명령을 실행합니다.

  cd D:\\ak-new-operators
  powershell -ExecutionPolicy Bypass -File .\\EXTRACT-NEW-OPERATORS.ps1

처음에는 중국 게임 설치 폴더를 선택하는 창이 뜹니다.
Python 3.12(64비트)와 필요한 패키지는 기존 환경을 재사용하거나 설치합니다.
Python 3.15 및 C++ 빌드 도구는 필요하지 않습니다. Node.js, 원본 저장소 clone도 필요하지 않습니다.

경로를 직접 지정하는 경우:
  powershell -ExecutionPolicy Bypass -File .\\EXTRACT-NEW-OPERATORS.ps1 -ClientPath 'D:\\중국게임설치폴더'

기본 동작은 매번 최신 설치 파일과 PersistentData 업데이트를 합친 새 읽기용 뷰를 준비합니다.
예전 work 폴더를 자동 선택하지 않습니다. 준비된 뷰를 명시적으로 재사용하려면 -ClientView를 지정합니다.

추출 범위
- 클라이언트의 character/skill/range/skin/module/audio/voice/대체폼 데이터와 원본 테이블 바이트
- 모든 승급/잠재능력/스킬 레벨/모듈 단계에 필요한 테이블 및 스킬 참조
- 기본 외형/승급 외형/설치된 모든 스킨/소환물 모델, 앞뒤 Spine·텍스처·메시·재질·애니메이션
- 스킬·공격·재능·Buff 동작 그래프, 투사체와 중첩 이펙트 의존 관계, 스킨별 부착 위치
- 초상화/아바타/스킬 및 모듈 아이콘
- 전투 SFX, 대상 경로로 확인된 설치 음성 및 스킨 음성 (서로 같은 CN_001 이름의 다른 캐릭터 음성을 섞지 않음)
- 대상이 사용한 원본 번들과 CAB 의존 관계: 웹 렌더러가 아직 지원하지 않는 구성요소도 후속 구현용으로 보존

최신 클라이언트 테이블만 사용하며 인터넷 공개 테이블로 대체하지 않습니다.
패키지 설치에는 인터넷을 사용하지만, 게임 데이터 수집은 로컬에서만 합니다.
새 클라이언트 테이블이 JSON으로 해독되지 않으면 원본 바이트를 보존하고 PARTIAL로 보고합니다.
이 경우 임의 변환한 온라인 데이터를 넣지 말고 operator-report.json, tables/table-report.json과 결과를 올려 주세요.
별도로 로컬에서 해독한 최신 테이블 폴더가 있다면 -TablesPath 'D:\\local-excel'을 지정할 수 있습니다.
그 폴더는 해당 중국 클라이언트와 같은 버전이어야 합니다.

다른 오퍼레이터를 선택할 수도 있습니다(기본 세 명을 대체).
  powershell -ExecutionPolicy Bypass -File .\\EXTRACT-NEW-OPERATORS.ps1 -Operators '실제중국어이름','char_실제_ID'

결과
- UPLOAD: 뒤에 나온 파일을 모두 올려 주세요. 결과가 20MiB를 넘으면 .zip.001, .zip.002 ... 로 나뉩니다.
- 큰 ZIP 본체와 분할 파일을 중복으로 올릴 필요는 없습니다. UPLOAD에 표시된 분할 파일 전부면 됩니다.
- PARTIAL이면 operator-report.json과 실행 로그도 함께 올려 주세요. 누락을 성공으로 숨기지 않습니다.
- 신규 인물/모델을 실제로 못 찾았거나 스킬/음성/스킨/의존 리소스가 빠지면 COMPLETE로 처리하지 않습니다.
- 실제 중국 클라이언트의 세 신규 대상에 대한 실행은 사용자의 PC에서 확인해야 합니다.
- 이 도구는 추출까지만 합니다. 선발 목록 등록과 전투 로직 구현은 결과를 받은 뒤 별도로 진행합니다.
- 원본 클라이언트와 이전 추출 결과는 수정하지 않습니다.
'''


def build(output):
    output = Path(output); output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name in MODULES: z.write(ROOT/'tools/local-extract'/name, 'tools/local-extract/'+name)
        for path in sorted((ROOT/'tools/local-extract/cn-schemas').iterdir()):
            if path.suffix in ('.fbs', '.json'): z.write(path, 'tools/local-extract/cn-schemas/'+path.name)
        # Existing exporters optionally query repository plugins; this standalone kit has none.
        z.writestr('tools/local-extract/plugin-fx.mjs', 'process.stdout.write("[]");\n')
        z.write(ROOT/'tools/local-extract/new-operators-START.ps1', 'EXTRACT-NEW-OPERATORS.ps1')
        z.write(ROOT/'tools/local-extract/prepare_client.py', 'prepare_client.py')
        z.writestr('README-ko.txt', b'\xef\xbb\xbf'+README.replace('\n', '\r\n').encode('utf-8'))
        z.writestr('targets.json', json.dumps({'targets': ['塔露拉', '国度', '冻河'], 'aliases': {'Talulah': '塔露拉', 'Территория': '国度', 'Тоска': '冻河'}}, ensure_ascii=False, indent=2))
    return output


if __name__ == '__main__':
    print(build(sys.argv[1] if len(sys.argv)>1 else ROOT/'public/assets/local/dev-tools/arknights-cn-new-operators-kit.zip'))
