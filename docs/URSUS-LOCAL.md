# 우르수스 로컬 실험

이 실험은 `local/ursus-experiment` 브랜치에만 적용한다. GitHub 푸시나 EC2 배포는 하지 않는다.
일반 `npm start`는 기존 `data/`를 사용한다. 우르수스 실행은 `.cache/ursus-data/`에 생성한 별도 데이터를 사용한다.

## 실행

Node.js 22 이상이 설치된 PC에서 저장소 폴더를 열고 실행한다.

```sh
npm ci
npm run dev:ursus -- --open
```

Windows에서는 `scripts/start-ursus-windows.bat`를 더블클릭해도 된다.
첫 실행은 공식 데이터와 추가 리소스를 다운로드한다. 이후에는 `.cache/`와 `public/assets/`를 재사용한다.
서버는 `127.0.0.1:3001`에만 바인딩한다. 포트 변경은 `URSUS_PORT` 환경 변수로 한다.
테스트 화면: `http://127.0.0.1:3001/dev/ursus.html`. 실제 게임 로비: `http://127.0.0.1:3001/`.
테스트 화면에서는 2/3/5/6명, 중첩 수, 일반/정예를 선택해 실제 시뮬레이터의 결과를 비교한다.
실제 게임 로비는 기존 브라우저 리소스 다운로드 안내를 유지한다. 새 오퍼레이터 리소스는 로컬 서버에서 제공한다.
종료는 서버 터미널에서 Ctrl+C. 원래 버전 실행은 `npm start`.

## 진영

베토치키와 굼의 기존 소속을 유지하면서 우르수스를 추가한다. 신규 8명도 일반/정예 모두 추가한다.
3명: 전투 시작 시 제국 드론 1기. HP와 공격력 보정은 `1.25 + 0.01 × 우르수스 중첩`.
6명: 해당 플레이어의 제국 드론과 우르수스 오퍼레이터 ASPD +50.
동일 오퍼레이터의 복수 배치는 기존 진영 계산처럼 별도 인원으로 세지 않는다.
드론은 공식 `enemy_1112_emppnt`의 기본 HP 13,000, 공격력 1,000을 사용한다.
따라서 0중첩은 HP 16,250 / 공격력 1,250, 20중첩은 HP 18,850 / 공격력 1,450이다.
우르수스 자체는 특질로 중첩을 얻는다. 드론의 배치 위치는 기존 염국 소환수와 같은 비점유 공중 위치 선택을 사용한다.

## 신규 특질 (일반 / 정예)

| 오퍼레이터 | 단계 / 소속 | 특질 |
| --- | --- | --- |
| 우쿠시크 | 3 / 우르수스·조력 | 준비 종료: 활성 우르수스 +2 / +4중첩 |
| 헬라그 | 6 / 우르수스·독행 | 전투: 자신의 공격력·최대 HP +20% / +40% |
| 지마 더 레이징 타이드 | 6 / 우르수스 | 준비 시작: 활성 우르수스 +4 / +8중첩 |
| 이스티나 | 3 / 우르수스·협동방어 | 준비 시작: 자신의 활성 진영 +2 / +4중첩 |
| 로사 | 5 / 우르수스·정밀 | 우르수스·정밀 총 중첩 3당 자신의 공격력 +2% / +4% |
| 레토 | 4 / 우르수스 | 준비 종료: 자신과 앞 칸 오퍼레이터의 활성 진영 +2 / +4중첩 |
| 압생트 | 2 / 우르수스·아케인 | 준비 종료: 활성 우르수스 +2 / +4중첩 |
| 보타니 | 3 / 우르수스·신속 | 준비 시작: 활성 신속 +2 / +4중첩 |

기존 특질의 이벤트 및 블랙보드 구조를 재사용한다. 활성화 전에는 중첩 증가가 발생하지 않는 특질이다.
새 오퍼레이터는 S1을 기본 스킬로 사용한다. 능력치·사거리·스킬 레벨·재능 데이터는 공식 데이터 생성기로 계산한다.
S1 전투 코드는 실험용이며, 다른 선택 스킬은 기존 generic fallback으로 동작한다.
우쿠시크의 자신 대상 추가 치료 도약과 지마의 고지대 연쇄 폭발은 아직 별도 구현하지 않았다.
정식 게임과 모든 스킬·재능이 정확히 일치하는 완성본으로 취급하지 않는다.

## 구조와 출처

- `content/custom/ursus/operators.json`: 오퍼레이터 소속·단계·기본 스킬·특질 선택.
- `tools/build-ursus.mjs`: 기존 데이터 복사 및 공식 데이터 기반 추가 레코드 생성. `data/`는 쓰지 않는다.
- `tools/fetch-ursus-assets.mjs`: 공개 초상화·스킬 아이콘·전투 Spine 다운로드 및 아틀라스 정규화.
- `server/sim/content/ursus.js`: 진영 효과. 전용 토큰 데이터가 없으면 아무 효과도 설치하지 않는다.
- `server/sim/content/kits/ursus.js`: 신규 S1과 재능의 실험용 전투 코드.
- `public/dev/ursus.html`: 실제 시뮬레이터와 렌더러를 이용하는 비교 화면.

원본 저장소의 `docs/DATA.md`, `docs/SIM.md`, `docs/CONTENT.md`, `docs/ASSETS.md`,
`docs/research/02-bonds.md`, `03-operators.md`, `07-assets.md`의 구조를 참고했다.
원본: https://github.com/sganggs/Stronghold-Protocol
공식 데이터 미러: https://github.com/Kengxxiao/ArknightsGameData
초상화/아이콘: https://github.com/yuanyan3060/ArknightsGameResource
전투 모델: https://github.com/fexli/ArknightsResource
기존 제국 드론 모델: https://github.com/isHarryh/Ark-Models
추가 아트는 Git에 포함하지 않는다. 권리는 원 권리자에게 있으며 기존 비상업적 팬 게임 안내를 따른다.

## 검증

```sh
node --test test/content/ursus.test.js test/content/ursus-data.test.js test/content/bonds_core.test.js test/match/bonds.test.js
```

로컬 생성 데이터를 검사하려면 먼저 `npm run dev:ursus`로 생성한다.
기존 공식 데이터에 우르수스 레코드가 없는지, 2명 미활성 / 3·5·6명 소환,
중첩 증가와 공격 속도 대상, 일반/정예 생성 결과를 검증한다.
