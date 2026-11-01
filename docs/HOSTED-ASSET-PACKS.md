# 에셋 저장소 연결과 첫 화염 소환 수정

2026-11-01. 버전과 기존 패치노트는 v0.3.3h 그대로 유지한다.

## 이번 리소스 연결

에셋 저장소 커밋: `moring-m/Stronghold-Protocol_Ko_Arca_assets@ed607c846868f44b03eea3b1c14235cf4eb7c7cd`.

- 세 선발 오퍼레이터의 모델·스프라이트·FX·SFX·음성에 쓰이는 1,092개 리소스를 크기와 SHA-256으로 검증해 에셋 저장소에 게시했다. 기존과 같은 파일은 재사용한다.
- 게임 저장소에서는 관련 페이로드 사본 1,090개를 제거했다. 공유 FX 인덱스 2개는 서버 합성용 메타데이터로 보관하지만 클라이언트 다운로드 원본은 에셋 저장소다.
- 기존 기본 리소스의 고정 참조는 유지하고, 이번 파일만 별도 불변 커밋에 고정했다. 에셋 저장소에 먼저 추가되어 있던 스킨 메타데이터도 공유 인덱스에서 누락되지 않도록 병합했다.
- `content/custom/resource-origin.json`의 `packs`가 manifest·저장소·커밋을 지정한다. manifest에는 경로·크기·해시가 있으며, 해당 파일의 다운로드 URL만 팩의 GitHub raw/jsDelivr URL로 연결한다.
- 빌드에서는 기존 기본 팩/스킨을 합성한 뒤 추가 팩을 내려받아 검증한다. 일반 파일 충돌이나 기존 FX 키 손실은 오류로 중단하며, 합성 인덱스의 직렬화 차이는 내용을 보존하는 경우에만 정규화한다.
- 로컬 서버도 운영 카탈로그를 사용한다. 팩 페이로드는 검증된 `public/`·`.cache/` 사본을 쓰고, 없는 파일은 고정된 원본에서 검증 후 받아 제공한다. 파일을 재생성하는 것만으로 게임 저장소에 페이로드가 다시 생기지 않는다.

## 앞으로 추가할 때

1. 리소스를 추출·변환해 `.cache/`에 준비한다. `tools/import-northern-assets.mjs`의 기본 출력도 `.cache/northern-asset-staging`이다.
2. `node tools/publish-resource-pack.mjs ASSET_REPOSITORY MANIFEST NAME`으로 소스 해시·기존 키 보존을 검사하고 에셋 저장소의 `public/`, inventory, 팩 manifest를 갱신한다. 이 도구 자체는 커밋·푸시하지 않는다.
3. 에셋 저장소에 커밋·푸시한 뒤 게임의 팩 설정에 전체 커밋 SHA와 manifest 경로를 등록한다. 브랜치 이름을 다운로드 원본으로 고정하지 않는다.
4. 원본 URL의 실제 응답과 해시, 빌드 설치, 로컬 표시를 검증한다. 게임 저장소에는 코드·연결 메타데이터만 커밋한다. 이 규칙을 `CLAUDE.md`에도 반영했다.

## 탈룰라 ‘작열하는 광환’

원인은 첫 파동의 누적 시간을 0에서 시작하고 일반 주기 2.67초가 차야 소환하도록 처리한 것이었다. 이제 스킬의 `onStart`에서 첫 파동을 즉시 생성하고, 두 번째부터 기존 주기를 따른다. 과부하의 13줄 제한, 후방 최대 11칸의 시작 위치, 방향·비행·충돌·수명 규칙은 유지한다.

## 검증

- 팩 1,092개 전부의 로컬 원본과 에셋 저장소 파일 크기·SHA-256을 대조했다. 재생성 결과도 게시된 팩과 동일했다.
- GitHub의 해당 고정 커밋에서 모델·아틀라스·스프라이트·FX·텍스처·메시·SFX·음성·두 인덱스 등 10개 유형의 실제 HTTP 응답과 해시를 확인했다.
- 로컬 서버의 모델·SFX·공유 인덱스 응답 200 및 해시 일치, 카탈로그의 에셋 저장소 URL을 확인했다.
- 팩 URL 우선순위·체크섬 실패·캐시 재사용·FX 키 보존·기본 팩 이후 설치·canonical hash 등록과 첫 파동의 동시 소환/다음 주기 대기 테스트를 추가했다.
- 4인·8인 맵의 방향별 줄·끝까지 비행 테스트는 유지한다. 원래 후방에서 출발하므로 즉시 소환이 즉시 적중을 뜻하지는 않는다.

최종 관련 테스트 243개 통과. 배포 라우팅 검사 66개 통과·브라우저 전용 2개 건너뜀, 정적 import·공백·배포 셸 구문 검사 통과. 이번 변경에서는 버전 파일과 패치노트를 수정하지 않았다.

### Clean-build index validation

The official v0.3.0 importer writes the upstream FX index before the two supplement stages. The hosted canonical index adds nested mount aliases to some existing skin entries. Exact whole-entry equality incorrectly rejected these additions in the Docker build. Validation now recursively preserves every existing leaf and ordered array, while allowing additional object fields; changed or removed values still fail. The installer integration test includes a nested mount-alias addition after supplement hydration.

Verified against a clean Git export: vendor → prepared catalogue → SHA-verified official release import → local FX supplement → hosted resources (exact pinned base checkout and verified pack payloads) → Korean UI → language packs → resource-origin application. The original validator reproduced the CI failure; the corrected validator completed the same stages. Related tests: 20 passed; lint and strict import checks passed.
