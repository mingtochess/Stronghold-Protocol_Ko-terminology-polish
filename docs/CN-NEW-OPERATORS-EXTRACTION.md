# 중국 클라이언트 신규 오퍼레이터 추출

기본 대상은 **세 명**이다.

- 塔露拉 / Talulah
- 国度 / Территория
- 冻河 / Тоска — 두 이름은 같은 한 명이다.

코드명이나 캐릭터 번호를 추측해서 고정하지 않는다. 업데이트된 중국 클라이언트의 `character_table`에서 이름을 실제 charId로 해결한다. 기존 게임에 없는 오퍼레이터도 대상이 될 수 있으며, 지정하지 않은 다른 오퍼레이터를 모델 추출 대상으로 추가하지 않는다.

## Windows 실행

1. 중국 PC 클라이언트를 업데이트하고 필요한 스킨·음성 리소스를 게임에서 다운로드한다.
2. 도구 ZIP을 게임과 **같은 NTFS 드라이브의 별도 폴더**에 푼다. 예: `D:\ak-new-operators`. 게임 설치 폴더 안에는 두지 않는다.
3. 그 폴더에서 PowerShell을 연다.

```powershell
powershell -ExecutionPolicy Bypass -File .\EXTRACT-NEW-OPERATORS.ps1
```

중국 게임 설치 폴더를 선택하는 창이 뜬다. 직접 지정할 수도 있다.

```powershell
powershell -ExecutionPolicy Bypass -File .\EXTRACT-NEW-OPERATORS.ps1 -ClientPath 'D:\중국게임설치폴더'
```

- 64비트 Python 3.12를 찾고 `.venv`를 준비한다. 호환되지 않는 기존 가상환경은 삭제하지 않고 다른 이름으로 보존한다.
- 패키지 설치에는 인터넷이 필요하지만, 게임 테이블을 온라인에서 가져오는 기능은 없다.
- Python 3.15나 C++ 빌드 도구, Node.js, 프로젝트 저장소 clone은 사용자 PC에서 필요하지 않다.
- 설치 폴더와 `PersistentData/Bundles`의 업데이트를 합친 새 읽기용 하드링크 뷰를 만든다. 이전 작업 폴더를 자동으로 재사용하지 않는다.
- 기존 뷰를 명시적으로 사용할 때만 `-ClientView 'D:\...\work\cn-client-...'`를 지정한다.
- 다른 대상을 지정하면 기본 세 명 대신 그 대상만 사용한다: `-Operators '중국어이름','char_실제_ID'`.

## 수집 범위

| 종류 | 포함 내용 |
| --- | --- |
| 구현용 데이터 | 캐릭터의 승급·잠재능력·특질·재능·속성, 모든 스킬 레벨, 범위, 모듈과 단계별 효과, 대체 폼, 음성 정의. 클라이언트 테이블 원본 바이트도 보존 |
| 기본·스킨 모델 | 승급 및 설치된 모든 스킨, Front/Back을 포함한 모든 Spine 노드와 비활성 폼, 아틀라스·텍스처·메시·재질·애니메이션 |
| 소환물 | 캐릭터·스킬·모듈 데이터에 선언된 소환물과 추가 소환물 체인, 묶음 번들 안의 소환물 모델 |
| 이펙트·투사체 | 공격 모드·스킬·재능·Buff 동작 그래프, 투사체, 중첩 이펙트, 스킨별 부착 위치, 이름으로 확인되는 미참조 전용 이펙트 |
| UI | 아바타, 초상화, 스킬·모듈 아이콘 |
| 오디오 | 전투 SFX, 대상 경로에서 확인된 설치 음성 및 스킨 음성. 이름이 같은 `CN_001` 등 다른 캐릭터 음성을 섞지 않음 |
| 원본 의존 파일 | 추출된 항목의 원본 번들과 CAB 의존 관계. 아직 웹 렌더러가 지원하지 않는 구성요소도 후속 구현 자료로 보존 |

공유 번들에는 여러 캐릭터의 자료가 함께 들어 있을 수 있다. 원본 번들 보존 단계에서는 의존성 때문에 이런 공유 파일도 포함될 수 있지만, 개별 모델·음성 추출 대상은 요청한 인물과 필요한 소환물/폼으로 제한한다.

## 테이블 출처와 부분 추출

우선순위는 다음과 같다.

1. 명시적으로 제공한 최신 로컬 테이블(`-TablesPath`)
2. 현재 업데이트/준비된 뷰의 로컬 테이블
3. 업데이트를 적용한 클라이언트 번들의 TextAsset
4. 아직 최신 소스에서 발견되지 않은 테이블만 기본 설치 파일에서 확인

**최신 파일을 찾았는데 해독하지 못한 경우, 예전 기본 테이블로 몰래 대체하지 않는다.** 지원하는 JSON/압축 텍스트가 아닌 신규 바이너리 형식이면 원본 바이트와 오류를 남기고 `PARTIAL`로 보고한다. 이후 이 파일을 기준으로 디코더를 보완할 수 있다. 최신 클라이언트에서 따로 해독한 테이블이 있다면 다음처럼 지정한다.

```powershell
powershell -ExecutionPolicy Bypass -File .\EXTRACT-NEW-OPERATORS.ps1 -TablesPath 'D:\latest-local-excel'
```

테이블 이름을 찾지 못하거나 요청 인물을 해결하지 못한 경우도 성공으로 처리하지 않는다. 설치되지 않은 스킨/음성이나 읽을 수 없는 모델·이펙트·의존 파일도 보고서에 남긴다.

## 결과 전달

마지막 `UPLOAD:`에 표시된 파일을 전부 올린다. 20MiB를 넘으면 `.zip.001`, `.zip.002` ... 로 자동 분할된다. 표시된 분할 파일을 전부 올리면 ZIP 본체를 중복으로 올릴 필요는 없다.

- `operator-report.json`: 대상 확인, 단계별 성공/실패, 누락 항목.
- `tables/table-report.json`: 테이블 출처·해시·해독 실패.
- `operator-plan.json`: 실제 charId, 소환물·스킬·모듈·스킨과 필수 이미지 목록.
- `unit-skill-projectiles.json`, `buff-action-graphs.json`, `raw-unit-components.json`: 구현/연결 자료.
- `models/`, `base-fx/`, `costumes/`, `costume-wiring/`, `sprites/`, `audio/`, `source-bundles/`: 리소스와 원본 의존 자료.
- `files.json`, `run.log`: 파일 해시 및 실행 로그.

`PARTIAL`이어도 결과와 보고서를 먼저 올리면 된다. 원본 클라이언트와 이전 추출 결과는 변경하지 않는다. 이 도구는 **추출 도구**이며 선발 등록·전투 로직 구현까지 자동으로 끝내는 도구는 아니다.

## 개발·검증

도구 ZIP 생성에는 저장소와 Python만 필요하며, 로컬 `.cache`나 기존 FX 설치 결과에 의존하지 않는다.

```text
python3 tools/build-cn-new-operators-kit.py /tmp/arknights-cn-new-operators-kit.zip
python3 test/local-extract-new-operators.test.py
node --test test/local-extract-new-operators.test.js test/local-extract-cn-launcher.test.js test/local-extract-operators.test.js
```

원본 게임 자료가 없는 합성 fixture로 대상 별칭, 소환물/모듈/범위 의존 관계, Unicode 경로, 최신 소스 우선순위, 불명 형식 원본 보존, 다른 캐릭터 음성 혼입 방지, 번들 순환, 단독 ZIP과 `--client` 준비 경로를 검증한다. 실제 신규 중국 클라이언트와 PowerShell 실행은 사용자 PC에서 확인해야 한다. 이를 확인한 것처럼 보고하지 않는다.

### 테이블 단계에서 멈췄던 경우

테이블 검색은 설치 폴더의 다른 하위 경로와 이름이 불명확한 번들 내부까지 확인합니다. 전체 번들을 확인할 때는 시간이 걸리며, `Client table bundles` 진행률이 출력됩니다. 해석할 수 없는 테이블은 원본을 보존하고 `PARTIAL`로 보고합니다. `tables/bundle-inventory.json`에는 검색한 번들 목록이 들어갑니다.

AES-CBC로 암호화된 클라이언트 JSON/BSON 테이블도 로컬에서 복호화합니다. 실행기가 `pycryptodome`과 `pymongo`를 설치합니다. TextAsset 이름이 제거된 경우 Unity 컨테이너 경로로도 식별합니다. 아직 식별하지 못한 테이블을 분석할 수 있도록 `anon/` 번들과 내부 객체 목록을 `tables/opaque-bundles/`, `tables/opaque-inspection.json`에 보존하므로 결과 압축 파일이 커질 수 있습니다. 이는 모든 최신 테이블 형식이 지원된다는 뜻은 아닙니다.

### 2026-11-01 테이블 형식 보완

- `character_tablec913b6`처럼 뒤에 6자리 16진수가 붙은 테이블 이름을 식별합니다. 임의의 접두사 일치로 다른 파일을 테이블로 오인하지 않습니다.
- 128바이트 서명 뒤에 저장된 CN FlatBuffers 테이블을 순수 Python으로 읽습니다. 별도 `flatc` 실행 파일은 필요하지 않습니다. 번들에 포함한 스키마의 출처·커밋·해시는 `cn-schemas/SOURCES.json`에 기록되어 있습니다. 스키마는 바이너리 구조 정의이며 온라인 게임 테이블을 대신 사용하는 것이 아닙니다.
- `character_table`, `skill_table`, `battle_equip_table`의 루트 래퍼를 기존 추출기가 사용하는 사전 형태로 변환합니다. 스키마와 다른 필드나 잘못된 포인터는 오류로 보고합니다.
- 업데이트 전후 테이블이 서로 다른 익명 번들 이름으로 공존할 수 있으므로, 새 읽기 뷰의 `client-bundle-sources.json`으로 업데이트 번들을 기본 번들보다 우선합니다. 이전 뷰를 `-ClientView`로 재사용하면 이 출처 정보가 없을 수 있으므로 일반 실행으로 새 뷰를 준비합니다.
- 필수 테이블을 모두 읽으면 대량의 익명 진단 번들 복사는 생략합니다. 개별 테이블 원본은 계속 보존합니다.

업로드된 166개 익명 번들에서 테이블 10개와 세 대상의 스킬 9개, 기본/승급 외형 정의 6개를 실제로 읽었습니다. 원본과 업데이트 사본 간 일부 캐릭터·스킬 수치가 달랐으므로, 최신 판정은 새 뷰의 출처 기록을 사용합니다. 해당 자료에는 모델·이펙트 번들 전체가 없으므로 전체 리소스 추출 성공이나 Windows 실제 실행까지 확인한 것으로 취급하지 않습니다.

### 완료된 결과의 원본 번들이 큰 경우

`source-bundles/`는 복구를 위한 원본 AB와 그 번들 단위 의존 자료입니다. 공용 스킬/버프/텍스처 번들에는 다른 캐릭터의 데이터도 함께 들어 있으므로 변환된 개별 리소스보다 클 수 있습니다. `.ab`라는 확장자만으로 불필요하다고 판단해 삭제하지 않습니다.

업로드용 ZIP에서는 원본 복구 번들을 기본 제외하고, 변환된 모델·이펙트·투사체·아이콘·음성·데이터·보고서는 유지합니다. 제외 목록은 ZIP 내부 `upload-manifest.json`에, 실제 포함된 파일의 해시는 `files.json`에 기록합니다. 원본 폴더와 이전 압축 파일은 변경하지 않습니다.

이미 추출을 완료했다면 새 도구를 기존 도구 폴더에 덮어쓴 후 다음 명령으로 재압축만 합니다. 경로는 실제 완료된 폴더로 바꿉니다.

```powershell
.\.venv\Scripts\python.exe .\tools\local-extract\package_operators.py 'C:\MyFolder\Assets\arknights-cn-new-operators-kit\cn-operators-실제완료폴더'
```

마지막 `UPLOAD:` 파일만 업로드합니다. 원본 `.ab`는 PC에 보관하고, 변환 누락을 추가 분석할 때 필요한 번들만 별도로 전달할 수 있습니다. 전체 원본을 포함한 압축이 필요하면 `--include-sources`를 추가합니다.

### 2026-11-01 미디어 누락 추가 추출

`123335-987700` 결과는 테이블 10개, 기본/승급 모델 6개, 타깃 스킬 9개·투사체 4개의 연결 정보 및 이펙트 75개가 존재하지만, 오디오 0개와 필수 이미지 10개 누락으로 `complete: false`입니다. UnityPy 컨테이너의 `PPtr`를 `ObjectReader`로 잘못 취급해 오디오 검색이 실패했고, 스킬 이미지의 `skill_icon_` 접두사를 처리하지 못했습니다. `charWordId`를 음성 소유자로 잘못 세던 경로도 수정했습니다. 초기 모듈(`INITIAL`)의 공용 배지는 개별 모듈 그림 누락으로 집계하지 않습니다.

모델·FX를 반복 추출하지 않고 다음 명령으로 오디오·이미지를 보완합니다.

```powershell
.\.venv\Scripts\python.exe .\tools\local-extract\repair_operator_media.py '.\cn-operators-20261101-123335-987700'
```

기존 결과의 타임스탬프와 **일치하는** `work/cn-client-*`를 찾습니다. 폴더를 이동한 경우 `--client-view 'C:\...\work\cn-client-20261101-123335-987700'`로 정확한 원본 뷰를 지정합니다. 별도 `cn-operators-media-*` 결과와 압축을 생성하며 원래 결과는 변경하지 않습니다. 모델/FX는 포함하지 않으므로 앞선 업로드와 함께 사용해야 합니다. 실제 SFX/음성 복구 성공은 추가 추출 보고서로 확인합니다.
