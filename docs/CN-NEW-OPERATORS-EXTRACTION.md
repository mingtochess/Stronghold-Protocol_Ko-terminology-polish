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
