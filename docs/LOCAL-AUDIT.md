# 우르수스 로컬 전투 점검 (2026-10-04)

운영 사이트로 배포하거나 GitHub에 푸시하지 않았다. 변경은 `local/ursus-experiment` 작업 공간에서 실행한다.

## 요청별 결과

| 항목 | 적용·검증 결과 | 남은 차이 |
| --- | --- | --- |
| 제국 드론 | 지상 유닛 위 렌더링, 중앙 오른쪽 소환, 본진에 가까운 적 우선, 범위 밖 추적 이동, 공속 적용. 고정 좌표 예고 후 수직 낙하·광역 피해. HP/공격력은 25% + 중첩당 1.5%p | 아래 영상 비교 제한 참조 |
| 3D 맵 | 공식 CDN의 오토체스 배경·상자·송풍기·게이트 메시와 보드 텍스처를 추출하여 기존 3D 렌더러에 연결. 사용 가능한 8개 맵을 1920/1280 두 해상도로 확인 | Unity 씬 전체를 그대로 실행하는 방식이 아니다. 타일 형상은 기존 렌더러와 공식 UV 테이블 사용 |
| 현재 맹약 위치 | 화면 중앙 정렬. 실제 브라우저에서 두 해상도의 중심 좌표 확인 | — |
| 공격 모션·적 이동 | Spine hit 이벤트를 사용하는 기존 타격 시점과 공격 정지 로직 점검. 적별 공격 클립 테스트 통과 | hit 메타데이터가 없는 클립은 기존 추정 시점 사용 |
| 맵 환경 | 침수·물타일·지형 관련 테스트 및 기습 맹약 지형 처리 확인 | 원작 모든 이벤트 전용 장치까지 재현하지는 않음 |
| 맹약 | 전체 등록·수치 테스트, 숨겨진 중첩 표시/대상/바운티 처리를 수정한 upstream PR 반영. 우르수스 별도 테스트 | 원본 문서의 `ASSUMED` 수치는 추정값임 |
| 적 | 249개 레코드의 일반/전용/보스 구현 분류 및 행동 테스트 확인 | 아래 원작 전용 기믹 제외 목록 참조 |
| 오퍼레이터 | 기본 112명, 선택 스킬 283개 커버리지. 우르수스 신규 8명의 19개 스킬 일반/정예 및 모듈 별도 검증. 배치 즉시 스킬·특성 회복 관련 upstream 수정 반영 | 지마 S3 고정 칸 타격 등 기존 근사는 URSUS-LOCAL.md 참조 |
| 비주얼 이펙트 | 월드 위치를 저장하고 카메라 변화에 재투영. 눈 날씨는 화면 효과로 유지. 카메라 변경 회귀 테스트 통과 | 짧은 탄도 잔상과 일부 날씨는 별도 경로. 모든 원작 Unity 파티클의 완전 재현은 아님 |
| 효과음 | 제국 드론의 공식 조준·발사·폭발 은행 사용. 전투 이벤트 소리를 화면 재생 시점에 맞춰 전달 | 다른 모든 적/스킬의 음향을 영상으로 개별 대조한 것은 아님 |
| 배경음악 | 공식 전투 음악을 1~7라운드/8라운드 이후 전환. 연방전은 공식 corrosion 트랙 유지 | 모든 원작 전투 영상의 재생 순서와 동일함을 보장하지 않음 |
| 공격 흔들림 | 오퍼레이터의 인위적인 몸체 이동 제거, Spine 자체 공격 애니메이션 유지 | — |
| 장비 교체 | 기존 선택창 유지. 실제 장비 드래그 → 취소 → 두 번째 장비 선택·확정 요청의 replaceUid 확인 | — |
| Enter 채팅 | Enter로 열기·입력 포커스. 입력창·대화상자·한글 조합 중에는 가로채지 않음 | — |

## 원본 PR 반영

전체 패치를 무조건 합치지 않고 현재 우르수스·오디오 코드와 겹치는 부분을 직접 통합했다. 이미 베이스에 반영된 PR은 중복 적용하지 않았다.

- [#109](https://github.com/sganggs/Stronghold-Protocol/pull/109): 배치 발동 스킬 수명주기와 지속시간 표시. 기존 재배치 SP 유지 경로 보존.
- [#115](https://github.com/sganggs/Stronghold-Protocol/pull/115): 스킬 피해에 따른 회복 특성 처리.
- [#66](https://github.com/sganggs/Stronghold-Protocol/pull/66): 신속/오라/숨은 중첩/바운티/기습 지형 관련 수정.
- [#110](https://github.com/sganggs/Stronghold-Protocol/pull/110): 연방전 공식 음악.
- [#72](https://github.com/sganggs/Stronghold-Protocol/pull/72): 라운드별 전투 음악 부분 적용. #110의 연방전 음악 선택을 유지.

## 공식 에셋 출처 및 재실행

`npm run assets:battle`로 필요한 번들만 다운로드하고 Python 가상환경에서 추출한다. 최초 실행에는 Python 3와 venv 지원 및 인터넷이 필요하다. 이후 번들·오디오 다운로드는 캐시를 재사용한다.

- 번들 목록: ArknightsAssets/ArknightsAssets2 `cn/bundles/hot_update_list.json`
- 공식 CDN: `ak.hycdn.cn/assetbundle/official`, Android 번들 버전 `26-09-22-07-47-20_6c71fa`
- 필요한 14개 번들만 받으며 압축 해제한 AB의 MD5를 공식 목록과 비교한다.
- 추출물: `public/assets/local`; 실험용 매니페스트: `.cache/ursus-local-assets.json` → `.cache/ursus-data/local-assets.json`
- 공식 오디오 은행 매핑: `audio_data.json`; 파일: ArknightsAssets/ArknightsAssets2 공개 리소스.
- 드론: `enemy_1112_emppnt.attack` 조준/발사, `projectile_enemy_emppnt` 충돌 음향.
- 맵 3D 파일은 `.cache`/`public/assets`의 로컬 산출물이며 Git에 포함하지 않는다.

## 영상 비교의 한계

참고 영상은 https://www.youtube.com/watch?v=SZbPMGf9qTs 이다. 제목·재생 정보는 확보했지만 이 실행 환경에서 실제 영상 CDN 연결이 거부되어 재생 프레임을 받지 못했다. 따라서 영상을 보았다고 하거나 프레임 단위로 같다고 판정하지 않는다. 수직 낙하와 고정 좌표 예고는 사용자 요구에 따라 구현했고, 소리는 공식 데이터의 은행을 사용한다. 정확한 원작 예고 시간·낙하 프레임의 영상 대조는 아직 미완료다.

## 원작 전용 기믹 제외 목록

`server/sim/content/enemies.js`의 `STATS_ONLY`에 사유가 명시되어 있다. 일반 공격만 있는 적과 미구현 기믹 적을 구분한다.

- R 시리즈 장갑 상호작용: `enemy_1251_*`, `enemy_1252_lysytb_2`
- 제단 펄스: `enemy_1367_dseed`
- 봉동/난방기 구역: `enemy_1387_winshd`
- 사슬: `enemy_1415_mmkabi_2`
- 증식 갑각: `enemy_1438_dspred`
- 카니발 시간: `enemy_10040_cnvbln`
- 현수교/대포: `enemy_10043_sailor`
- 광부 유격대 상호작용: `enemy_10124_uashld_2`

현재 모드에 대응 장치가 없는 기믹을 임의로 다른 능력으로 대체하지 않았다. `docs/SIM.md`와 구현의 `ASSUMED` 주석은 공식 블랙보드에 없는 수치에 대한 기존 추정 근거다.

## 검증 방법

```sh
npm run assets:battle
npm run dev:ursus
node --test test/content/*.test.js test/sim/*.test.js test/render/*.test.js test/ui/*.test.js test/chat-browser.test.js
node --test test/match/*.test.js
```

추가로 실제 브라우저의 3D 맵 16화면, 드론 공중 렌더링 순서, 장비 교체 및 맹약 중심 좌표를 확인했다. 임시 공개 주소에서는 welcome → 방 생성 → 경기 시작 응답을 확인한다. 자동 테스트 통과는 원작과 모든 시청각 요소가 같다는 증거는 아니다.

최종 content/sim/render/ui/채팅 브라우저 실행: 2,612개 중 2,603개 통과, 9개 선택적 테스트 건너뜀, 실패 0개. 전체 match 포함 선행 실행은 3,120개 중 3,106개 통과/13개 건너뜀/오디오 매니페스트 1개 실패였으며, 해당 매니페스트를 공식 파일로 보완한 뒤 오디오 테스트를 다시 통과시켰다.

## 2026-10-05 후속 수정

- 드론의 도발 무시 예외를 없애고 일반 아군 타겟 우선순위로 복원했다. 범위 밖 추적 이동은 유지한다.
- 모든 실제 유닛에서 인위적 공격 몸체 이동을 제거했다. 실제 종류는 `op`였는데 이전 수정은 `chess`만 제외하여 흔들림이 남았다. 대체 초상화 렌더링의 아군 상하 흔들림도 제거했다.
- 오퍼레이터도 실제 공격마다 Spine 클립을 한 번만 재생한다. 기존 루프와 마지막 타격 뒤 `interval * 1.4` 유지가 다음 공격 없이도 모션을 반복시키던 원인이었다.
- 비행·근지 부유·떠오름 상태는 지형과 지속 장판에서 제외한다. 드론의 소환 순간 남은 지형 버프도 지운다. 원작의 일부 오염 장판은 공식 설명상 공중에도 영향을 주지만, 여기서는 사용자의 모든 공중 유닛 장판 면역 요구를 우선하여 제외했다. 떠오름의 기존 타겟 선택 규칙은 변경하지 않는다.
- 밴 목록은 소속 맹약별로 분류한다. 두 맹약에 속한 오퍼레이터는 양쪽 목록에 표시하며 상단 숫자는 중복 없는 총인원이다.
- 맹약 팝업은 `minmax(0,1fr)`와 긴 이름 줄임 표시를 사용해 초상화 크기를 유지한다. 전체 이름은 툴팁에서 확인한다.
- 방 대기실 채팅은 왼쪽에 크게 기본 열림으로 표시한다. 닫힌 최근 채팅에 배경과 닉네임/본문 색상 차이를 추가했고 우르수스 진영을 추가했다.
- 우쿠시크는 준비 진입 시 자신의 활성 맹약 각각 +4, 레토는 발동당 +2/전투당 10회(총 +20)다. 일반/정예 동일 조건을 테스트했다.
- 보스는 준비 중 실제 스폰 좌표에 표시한다. 거대 고정 보스의 공식 hitArea 사각형을 표시하고 적 미리보기 펜/목록에서는 제외한다.
- 전투 중 클릭한 오퍼레이터의 실제 활성 사거리를 로컬 시뮬레이터에서 읽어 100ms마다 갱신한다. 준비 중에는 기존 배치 방향 사거리 표시를 유지한다.

### PRTS 난이도 배율 대조

2026-10-05 [PRTS 卫戍协议：盟约 下半 / 开始模拟](https://prts.wiki/w/%E5%8D%AB%E6%88%8D%E5%8D%8F%E8%AE%AE%EF%BC%9A%E7%9B%9F%E7%BA%A6_%E4%B8%8B%E5%8D%8A#%E5%BC%80%E5%A7%8B%E6%A8%A1%E6%8B%9F)을 확인했다. 직접 접속은 차단됐지만 본문 프록시로 표를 확보했다. 8개 모드의 111개 라운드, 공격력/HP/속도 333개 값을 비교했다. 소수점 6자리 반올림을 제외하면 다음 차이만 있다.

| 항목 | PRTS | 실제 코드 |
| --- | --- | --- |
| 솔로 표준·험난 기본 HP | 0.7 | 0.75 |
| 해당 모드 기본 공격력 | 0.7 | 0.7 |
| 나머지 HP/공격력 라운드 지수·극한 추가 HP 1.08 | 표의 값 | 일치 |
| 극한 3라운드 이후 이동속도 | 1.15 | 일치 |
| 보스 서버 공유 HP | 일반 적 HP 배율 제외 | 제외 |

0.75는 기존 자료가 공식 「攻坚装备III」의 HP 배율을 우선한 값이다(`01-core-data.json` 출처 주석 및 `build-data.mjs`). PRTS는 해당 표가 사용자 제공이며 정확성을 보장하지 않는다고 명시한다. 따라서 HP 0.75를 임의로 0.7로 변경하지 않았다. `GameData.enemyScale` → `waves.js` 스폰 mods → 전투 유닛 능력치 경로가 연결되며 웨이브·바운티·보스 ATK/속도에도 적용된다. 보스 공유 HP는 별도 bloodPoint를 사용한다.

### 한국어·일본어 음성

원본 [PR #73](https://github.com/sganggs/Stronghold-Protocol/pull/73)의 음성 채널/공식 슬롯 인덱싱을 참고하여 기존 오디오 변경과 통합했다. 해당 PR의 임의 1.2초 간격과 수동 스킬 10초 제한은 사용하지 않고, 공식 `audio_data.json battleVoice`의 우선순위·동순위 선점·수동/자동 스킬 구분을 적용한다. 새 음성은 기존 음성을 중지한 뒤 재생하며, 뒤늦게 디코딩된 이전 파일은 재생하지 않는다.

| 출력 | 조건 |
| --- | --- |
| 행동 출발 | 전투의 첫 오퍼레이터 배치 |
| 배치 | 이후 오퍼레이터 배치·재배치 |
| 행동 개시 | 해당 오퍼레이터의 첫 적 교전, 전체 교전 대사 간격 3초 |
| 선택 | 전투 중 오퍼레이터 상세 선택 |
| 작전 중 1~4 | 스킬 발동. 사용 가능한 공식 작전 대사 중 선택. 수동 스킬은 즉시, 자동 발동 스킬은 우선순위 60/50 및 유닛당 10초 제한 |
| 결산 | 자기 전투 결과의 완벽/고난도/누수/실패에 대응 |

우선순위: 시작100, 교전90, 스킬70(자동60/50), 배치20, 선택10. 같은 우선순위의 시작/수동 스킬/배치/선택은 이전 대사를 중지한다. 결산은 팬 게임 결과를 원작 4종 결산 슬롯에 대응하는 별도 규칙이다. 이 모드의 자동 배치·라운드 결산은 원작 일반 스테이지와 구조가 다르므로 출력 순서까지 완전히 동일하다고 보장하지 않는다.

설정에서 음성 볼륨과 한국어/일본어를 선택한다. 128개 캐릭터의 필요한 슬롯만 인덱싱하고 실제 재생한 파일을 서버/브라우저에서 재사용한다. 에셋은 `ArknightsAssets2/voice/assets/dyn/audio/sound_beta_2/voice_kr` 및 `voice`의 mp3이며 공식 `charword_table.json`의 대사 번호를 따른다.

우쿠시크는 현재 이 미러의 `voice_kr/char_4224_turdus/cn_019.mp3`가 404이다. 한국어 음성의 실제 출시 여부와 미러의 수록 여부를 구분한다. 서버 시작 때 파일 존재 여부를 확인하며 업로드되면 한국어를 사용한다. 지금은 일본어를 대신 재생한다. `npm run assets:voices`로 대사 목록을 갱신한 뒤 서버를 재시작할 수 있다.

후속 최종 검증: content/sim/render/ui/실제 채팅 브라우저 2,615개 중 2,606개 통과, 9개 선택적 테스트 건너뜀, 실패 0개. 난이도·웨이브 추가 검사 18개 통과/1개 건너뜀. 실제 브라우저에서 한국어/일본어 헬라그 음성을 다운로드·디코딩하여 재생한 버퍼(약 2.79초/2.08초)를 확인했고 오류가 없었다. 공개 테스트 주소의 방 생성·경기 시작도 다시 확인했다.

### v0.1.3 및 추가 선발 후속 적용

upstream v0.1.3(a0a5419)의 변경을 기존 로컬 변경과 병합했다. PR #120(관전자 인원 설정·퇴장, #119의 입장 코드 수정 포함) 및 #112(결산 알림·효과음)도 적용했다. 프로덕션 배포·커밋·푸시는 하지 않았다.

추가 선발은 기존 오퍼레이터와 탭을 분리하고 기존 카드·민트색 분할 버튼을 재사용한다. 토가와 사키코, 첸 더 던스트릭, 위셔델, 나란투야, 아스카론 중 사용자별 5단계·6단계 각각 2명까지 선택한다. 선택되지 않은 후보는 개인 상점·보상·직접 획득에서 제외한다. 특질은 없으며 공식 데이터의 15개 스킬과 7개 모듈을 사용한다. 아스카론 지속피해는 기본 공격 이벤트 및 피해 효과를 적용하되 공격 모션·공격 주기·독 중첩을 다시 발생시키지 않는다.

이펙트 링·조준선·빔 경계를 줄이고 종류별 외곽 그라데이션을 조정했다. 원작 Unity 이펙트의 완전 재현은 아니며 사키코 Fever 음악은 아직 별도로 재현하지 않았다.

병합 후 전체 검사 3,314개 중 3,303개 통과, 11개 선택적 검사 건너뜀, 실패 0개. 이후 추가 선발/모듈/지속피해 및 회복 회귀 검사 24개 통과. 실제 Chromium에서 탭 선택, 단계별 상한, 새로고침 후 보존, 추가 후보 전투 렌더링을 검사했다.

최종 후속 content/sim/ui 회귀 검사: 2,301개 중 2,293개 통과, 8개 건너뜀, 실패 0개. 공개 테스트 주소의 방 생성·경기 시작 및 Chromium 추가 선발 전투 오류 0개를 재확인했다.

### Local UI, voice and animation follow-up
- Loadout shows normal/elite garrison descriptions and a validated costume selector. The local catalog contains 183 costumes whose Front skeleton/atlas parse successfully; two unavailable models are excluded. Costumes persist in loadouts, apply to normal/elite preparation and battle models, and carry their own strike timing. Textures are downloaded only when displayed.
- KR/JP voice files are prefetched into `stronghold-operator-voices-v1` CacheStorage with two background workers; relevant shop/board voices are also decoded ahead of use within the existing 64 MB PCM budget. Preview audio responses now have an audio MIME type, avoiding the extra fallback request. Default voice volume is 60%; saved user volume preferences remain valid.
- Authored default+state Spine skins are composed when names match supported statuses or the selected skill. Otherwise thin state indicators remain visible. This is a fallback visual, not a claim that every original effect prefab has been ported.
- Instant skills with a dedicated clip play the full cast even when their runtime ends in the same tick. Attack/skill end transitions blend into idle; models with no matching selected-skill clip do not borrow another skill's clip.
- Texas S2 grants DP immediately, holds basic attacks during a 2-second cast, then applies damage/stun if she remains deployed and uninterrupted. Suzuran S3 and other listed area-support skills show their authored grids while active. The grid overlay is based on the skill data; it does not reconstruct every original game's effect prefab.
- Operators and enemies face their attack targets with a 100 ms horizontal-scale transition independent of the Spine animation clock. Deployment direction and gameplay range are unchanged by the cosmetic facing.
- Waiting-room chat is always open, has no close/toggle controls or per-message boxes; in-game closed previews retain per-message backgrounds. Banned operator portraits retain their full colors.
- Loadout roster clicks prepare voice files but never speak. Duplicate multi-effect garrison descriptions are deduplicated for display (e.g. two effect IDs carrying one combined description); effect IDs and simulation behavior remain intact.
- Final validation: 1,048 tests executed, 1,042 passed, 6 skipped, 0 failed. Additional focused flip/cast tests passed. Real Chromium verified costume portrait/model loading, trait display, silent configuration clicks, permanent room chat, and persistent voice caching; public tunnel transport passed welcome/room-create/match-start checks.

### Shared skins and persistent resource caching
- Avatar/portrait helpers use a shared appearance source, so selected cosmetics cover purchase cards, ban thumbnails, operator detail, configuration, and fallback portraits. Explicit unit/owner skins are preserved; locked matches keep their match loadout while configuration previews can show next-match choices.
- Skin edits persist and can be reset, but do not mark operators adjusted or enter the adjusted-only roster/count.
- Both resource workers cache successful requests for future uncatalogued assets automatically. Game-data/translation manifests use network-first with cached offline fallback; immutable art/models/audio use cache-first.
- Verification: 471 UI tests passed, 5 skipped, no failures. Real Chromium verified matching shop/ban costume images, zero adjusted count for a skin-only edit, a loaded costume Spine, and its texture in CacheStorage.

### 2026-10-05: skin, direct-click voice, room layout and enemy state follow-up

- Fixed costume IDs being discarded by `chessLoadout`, Battle construction, and content loadout recomposition. A real Battle regression checks both runtime model and spawn metadata.
- Removed selection speech from shop detail, enemy inspection and covenant-member inspection. Selection speech remains on direct owned-unit/purchased-piece clicks.
- Shop art occupies the full card. Waiting-room chat clears the 1.5rem footer; faction grid wraps within the panel and scrolls vertically.
- Ammo totals and remaining bullets travel separately from the elemental gauge; SP dividers follow the real count with no count cap.
- Snapshots now include all visible buff keys, avoiding missing states on reconnect or field changes; authored skins also receive active form and individual status names. Hit-count and arts-only barriers set the shield flag. Rage, refraction and shield have distinct lightweight fallbacks when authored attachments are unavailable.
- Utage S2 no longer borrows the generic S1 sheathed stance. Non-attacking skill stances do not replace OnAttack timing; stance remains the idle while active. Real S1/S2 content tests and animation tests pass.
- Audited 249 enemy model entries and declared idle/attack/move/death names: no invalid clip references. Original `enemy_1305_mhslim` and `_2` extracted from official `enm_art_12.ab`; optional local assets select these instead of aliases. `enemy_9016_acstmr` has no Spine in either Ark-Models or the official enemy art bundles inspected; its visual replacement remains unresolved.
- Reproduce official enemy extraction with `node tools/setup-battle-assets.mjs --enemy-spines`. Downloads keep MD5-verified bundle caches.
- Validation: UI/render/sim/content suite 2718 passed, 9 optional tests skipped. Additional targeted checks after stance-idle adjustment: 10 passed. Browser: selected shop/ban costume images and model load, persistent caches, chat/footer clearance and faction overflow, no page errors.
- Scope limit: metadata/behavior tests and state plumbing were checked; this does not establish frame-for-frame original visual equivalence for every enemy ability.

### 2026-10-05: movement, audio continuity and host-controlled custom factions

- Forced displacement retains the authoritative collision endpoint and sends a bounded visual trajectory. The renderer glides rather than treating large forces as teleports or extrapolating small forces as walking. Enemy attacks/walking pause during the visual displacement; contact blocking is still checked.
- Deployment waits for the selected Front/Back Start clip before ordinary actions and deployment-triggered skills. Late-loaded Spine actors catch up to Start instead of losing the event. Match fields deploy at 0.1-second intervals, scanning the left column top to bottom before the next column (mirrored for the opposite side). Each unit waits for its own Start to finish. Dragging a bench unit starts its visual Start locally while placement is validated; failed placement still returns it. Existing tile/direction-only moves do not play deployment speech.
- Stationary operator attacks hold their non-looping ending pose through the cooldown until the next wind-up; cancelling an attack returns to idle. Walking enemies retain the existing clip-end-to-movement behavior. No additional hit animation is looped during the hold.
- BGM requests now coalesce during decoding, retain the previous track until the next is ready, retry failed decoding, and loop the decoded buffer explicitly. Preparation and combat share the round-selected track, avoiding phase-boundary restarts.
- Bow/crossbow attacks use extracted original projectile sprites where available. Gun, arts, artillery and dedicated projectile families preserve their physical speed while drawing distinct visuals. Melee blades, thrusts, impacts, claws and arts have separate restrained cues. The generic skill activation flash was reduced to a brief small cue; its ongoing cue is a thin amber rising-arrow approximation, not a verified reproduction of every original particle prefab.
- A host-only waiting-room checkbox enables custom factions (default off). Ready states reset when the option changes. Each match gets a separate filtered data view: custom Ursus operators/equipment/bond are absent when disabled, and native Gummy/Betochki lose only their added Ursus affiliation. BattleSpecs carry the same setting into client simulations. Shared operator configuration remains complete with a custom-faction badge. Chat hides and rejects Ursus while disabled and clears a previously selected Ursus affiliation.
- Trait display deduplicates individual lines across multi-effect records (verified on Gravel's combined deployment/death trait). Shop portraits use uncropped chest framing, the skill badge was replaced with the main profession glyph, and the subclass row was removed. Scrolling a covenant popup no longer dismisses the operator panel. Bounty coin text is anchored above the killed enemy's world location.
- Ban groups and portraits have additional spacing; 23 previously untranslated catalogue strings received manual Korean translations where no official Korean mapping was found.
- Validation: UI/render/sim/content suite: 2,738 tests, 2,729 passed, 9 optional skipped, no failures. After final adjustments, targeted render/content/deployment checks: 457 passed, 1 optional skipped. Additional custom-data/weapon-family regressions passed. Chromium verified host/guest synchronization and disabled-faction rejection, unchanged configuration catalogue, non-repeating Gravel trait, chest framing/profession glyphs, skin propagation, voice caching, and no page errors. Local tunnel returned HTTP 200.
- Scope: previous enemy coverage was metadata plus authored behavior assertions, not frame-by-frame comparison of every original encounter. Registry coverage and 257 enemy/boss checks were rechecked; this does not establish exact original equivalence for every specialized enemy effect. The previously documented enemy_9016_acstmr missing model remains unresolved. No production deployment or Git push was performed.

### 2026-10-05: complete portraits, animation recovery and background patches

- Audited all 302 operator records (normal and elite). Six records had repeated trait lines: Gravel, Record Keeper and Vina Victoria, each at both rarities. `docs/TRAIT-TEXT-AUDIT.json` records the findings. Both configuration and in-game detail now render the same deduplicated multi-effect descriptions; gameplay hooks remain unchanged.
- Full illustrations replace the 180×360 portrait source in portrait surfaces and costume selections. `tools/build-illustrations.mjs` indexes 469 original PNGs from the asset repository's `arts/characters/<charId>/` directory, including costume filename case normalization. All 469 were downloaded successfully into the persistent server cache. Official avatar glyphs remain available for small icon surfaces.
- Fixed operator-kind mismatch (`op` vs `chess`) and the first-board-placement condition that skipped bench deployment visuals. Also fixed an invalid variable reference in expired pending-drag cleanup. Chromium verified bench placement plays Start.
- Replaced the previous attack-ending pose hold with a moving recovery tail for operators, preserving the authored wind-up/hit timing. Chromium verified real track time advances after the hit; the next attack does not loop another hit during recovery. Enemies retain their original clip speed.
- After a melee enemy kills/loses its blocker following the hit, it now stands until the remaining attack clip finishes. Target loss before the hit still cancels the pending wind-up. Regression verifies the enemy remains in place during recovery then resumes moving.
- Melee cues now accent the authored Spine weapon contact with small directed sparks rather than drawing a large second slash. Generic hit glow is reduced only for melee contact. Skill activation retains a moderate brief flash; ongoing amber marks have stronger opacity and slightly larger geometry, while dedicated skill/range effects remain present.
- Outside clicks close both operator and covenant panels, including a covenant panel left after closing the operator panel. Wheel input inside either panel is excluded. Waiting-room chat does not set the in-game expanded state; gameplay chat starts closed. Real Chromium verified both cases with no page errors.
- The preview server warms missing resources with two workers, prioritizing full illustrations, and coalesces foreground requests. The preview resource worker adds missing files to its durable browser cache in the background. Existing production-style caches also repair eviction and apply new manifests in the background, copying cached files across versions; only first installation needs download consent. A real browser fixture verified initial consent, retry, cached atlas normalization, eviction repair, patch-only download, and versioned-font cache reuse.
- Validation: broad UI/render/sim/content suite: 2,732 passed, 9 optional skipped, no failures. Subsequent targeted detail/loadout/resource checks: 23 passed; cache/preview checks: 4 passed; production-style background cache browser test passed. Browser checks also verified real Start/recovery animation and panel/chat transitions.
- Local-only changes; no production deployment or Git push.

### 2026-10-05: skill sounds, projectiles and animation feedback (18 items)

- Rest phases now select `prep` regardless of round combat track. The local manifest uses the official mode theme for preparation, distinct from battle tracks. Sequential initial deployment uses a 0.2 s interval in every match spec.
- Portrait helpers and the sandbox use the original half-body portraits again, including costumes and elite variants. Full-illustration downloads are removed from the preview startup; existing downloaded files are retained.
- Purchase of the first bench operator plays Start. Drag/drop and direction preview no longer start deployment; the confirmed state does. A confirmed move to a different board tile also plays Start; direction-only updates do not. Promotion keeps its separate cue.
- Authoritative attack-start events now control facing and timing. Look-ahead wind-up does not restart an explicitly announced attack. Multiple targets of the same strike do not restart the clip or turn the unit. Full-area attacks carry an explicit flag and do not turn. Walking direction only applies during MOVE. Sub-tile horizontal target differences have hysteresis.
- Removed artificially stretched attack recovery and network-jitter smoothing of authoritative attack intervals. Native clip speed is preserved, with acceleration for faster attack rates. A one-second simulation cadence regression identified floating-point cooldown residue causing an extra idle tick; comparisons now tolerate that residue. Native-duration consecutive clips are tested to transition directly; genuinely longer cooldowns can still use idle.
- Instant skill casts and activation clips resist normal-attack overrides. A skill ending after its attack hit defers End until the attack recovery finishes. All 662 native/costume Front/Back models are re-indexed for selectable skill slots. Death clips are excluded from skill attack variants; separate skill-idle/attack roles remain distinguishable. Mapping audit: `docs/SKILL-ANIMATION-AUDIT.json`.
- Official ON_SKILL_START banks are mapped by the equipped skill index for every operator, including custom/recruit records. 214 of 334 skill slots have a registered activation sound; the 51 distinct MP3 files are cached. Explicit missing banks remain silent rather than using another skill's sound. Mapping audit: `docs/SKILL-SOUND-AUDIT.json`. New sound files participate in the existing persistent background cache.
- Arrow sprites removed: projectiles use procedural lines/circles again. Artillery, fortress and splash-caster families and named enemy artillery use parabolic shells; official projectile speed/damage timing is unchanged. Existing dedicated vertical imperial-drone bombardment remains separate.
- Melee contact uses short normal-blend strokes (stab, cut, blunt impact, claw) instead of additive glows or sparks. Strokes stay at their world impact point when the camera moves. Skill activation/ongoing effects from the preceding patch remain.
- Skill coverage uses the actual active server range, including kit/module range changes, instead of a five-skill allowlist. Instant cast coverage briefly flashes. Persistent snow tiles serialize exact tile/layer state into snapshots, so Pramanix the Prerita's accumulation, consumption and removal are visible, including when watching/reconnecting. Existing zone FX continue to render other kits' ground areas.
- Frozen units retain their current animation pose with zero animation-clock advancement and an ice polygon/tint (or authored frozen skin); they resume on thaw. Forced displacement suppresses blocking until its visual trajectory ends, then ordinary blocking resumes.
- Local-only implementation; no commit, push or production deployment. Regression suite passed 2,735 tests (9 optional browser suites skipped) before the final cooldown correction; cadence, browser purchase/confirmation/freeze, sound isolation and pipeline tests also run separately. A final full regression rerun is recorded below.
- The legacy `test/assets.test.js` on-disk validation assumes the entire asset collection resides in `public/assets`; six such checks fail in this preview's persistent lazy-cache layout. Resolver/bank tests pass, and the preview serves cached assets successfully. No missing full offline-install validation is represented as passed.
- Final regression result: **2,737 passed, 0 failed, 9 optional skips** (`/tmp/patch18-complete-suite.log`). After the snow/air refinement, the 52 tier-6 content checks pass. Pipeline role/bank checks: 21 passed; final audio/projectile/melee checks: 47 passed. Real Chromium reports no page errors and verifies first purchase Start, no deployment during direction preview, confirmed-placement Start, frozen pose/clock and thaw. The running loopback preview is restarted with the final simulation and manifest.

## 배치·공격 대상 전환·미리보기 후속 수정 (2026-10-05)

- 결과 화면 음성 자동 재생을 제거하고 전투 시작 음성을 해당 필드의 오퍼레이터 중 무작위로 선택한다.
- 방향 미리보기에서 고정한 좌표와 서버가 확정한 배치를 구분하여 확정 후 Start를 재생한다. 같은 타일의 방향 변경은 재배치하지 않는다.
- 타격 전에 대상이 사라져도 범위 내 대체 대상이 있으면 선딜 종료 시각을 유지한다. atkRetarget은 방향만 갱신하며 Spine 공격 클립을 초기화하지 않는다.
- 스킬별 Attack과 Loop가 함께 있는 경우 Attack을 타격 클립, Loop를 대기 자세로 구분한다. 리드 S3 기본/스킨 Front·Back 등이 해당한다. 662개 모델의 역할 인덱스를 다시 생성했다.
- 보이는 적 미리보기는 공유 impostor atlas를 우회하고 매 프레임 스파인을 갱신한다. 기존 미리보기 전용 3프레임 간격 제한을 제거하고 클리핑을 유지한다. 화면 밖 모델의 갱신 생략은 유지한다.
- 검증: 관련 sim/audio/render 테스트 474개 통과, 선택적 브라우저 테스트 1개 생략. 에셋 역할/오디오 계획 테스트 21개 통과. Chromium에서 드래그→방향 확정→Start, 빙결/해제, 미리보기 36마리 모델 로드와 atlas 미사용 및 pageerror 없음 확인. 실제 사용자 장치의 FPS 개선 폭은 별도 측정 필요.
- 로컬 테스트 서버만 반영. 커밋/푸시/운영 배포 없음.

### 스킬 범위 수명·스타일 및 캐시 확인

- 지면 범위는 유닛 본체와 별도 레이어에 있어 사망/스킬 종료와 화면 밖 조기 반환 전에 즉시 지운다. 동적으로 전달되는 skillRanges도 표시할 수 있다.
- 범위 윤곽선을 1.4~2.6px로 강화하고 오퍼레이터 ID 기반의 옅은 색상·희소 선 패턴을 사용한다. 채움 알파는 0.065, 패턴 알파는 0.28이며 스킨/복제 유닛은 동일 스타일을 유지한다.
- 최종 관련 회귀 테스트: 476개 통과, 선택적 브라우저 테스트 1개 생략. Chromium에서 두 오퍼레이터 범위 스타일과 사망/스킬 종료 직후 geometry 제거 확인.
- 운영 resource-worker의 누락 파일 다운로드/재시도/버전 업데이트 재사용 브라우저 테스트와 개발 캐시 테스트 총 2개 통과. 운영 캐시는 경로 기준으로 재사용하므로 동일 경로 내용 변경은 별도 URL/캐시 갱신이 필요하다. 운영 전환 시 개발 환경에서 추가한 음성·스킨·스킬 사운드 다운로드 목록을 운영 리소스 인덱스에 포함해야 한다. 이번 작업에서는 운영 전환하지 않았다.

## 범위 스킬 구분·제국 드론 추적·이스티나 특질·기본 스킬 (2026-10-05)

- 스킬 범위는 명시된 범위 효과 스킬(스즈란 S3, 모스티마 S2/S3 등)만 전송한다. 단순 공격력/공속/사거리 강화는 표시하지 않는다. 신규 킷은 areaEffect로 명시할 수 있다. 범위 대상 목록은 server/sim/skillArea.js에 있다.
- 제국 드론 경고 파일 음량 0.7→0.22, 합성 비프 0.025→0.01. 수직 낙하 시작 시각에 Web Audio source를 정지한다. 리소스 디코딩 지연과 전투 재생 속도를 반영하여 낙하 중 뒤늦게 경고가 시작되지 않는다.
- 제국 드론은 기지까지 남은 경로가 가장 짧은 적을 추적한다. 다른 적이 사거리 안에 있어도 추적을 중단하지 않는다. 쿨타임이 끝나면 범위 안에서 기지에 가장 가까운 적을 공격하고 공격 모션 종료 후 추적한다. 도발보다 기지 거리 우선. 좌우 반전은 고정하며 최초 spawn 메타부터 이를 전달한다.
- 이스티나 일반/정예 특질: <전투 중> 공격 범위 내 정지 상태의 적이 사망할 때마다 활성화된 [우르수스][예견] 맹약의 중첩 수 각각 +2 (최대 7회). 정지는 sluggish 효과만을 뜻하며 일반 slow/기절/빙결/범위 밖 사망은 제외한다. 사망 하나는 맹약 수와 무관하게 1회. 일부 맹약이 나중에 활성화되어도 전투당 총 7회 제한은 공유한다.
- 기본 S1: 압생트·우쿠시크·보타니. 기본 S2: 이스티나·레토·로사·헬라그·지마. 일반/정예 및 구성 기본값에 적용하고, 테스트 화면에서 무조건 첫 스킬을 선택하던 문제도 수정했다. 사용자가 저장한 명시적인 선택은 유지한다.
- 검증: 관련 content/sim/audio/render 테스트 512개 통과, 선택적 브라우저 테스트 1개 생략. Chromium에서 이스티나 9회 사망 조건에 대해 각 맹약 +14로 제한됨, 스킬 선택 10개 항목의 기본값 일치, 드론 fixedFacing 메타 전달, pageerror 없음 확인. 테스트 사이트 HTTP 200.
- 로컬 테스트 서버만 반영. 커밋/푸시/운영 배포 없음.

### 카셰이 전략과 관전자 채팅 (2026-10-05)

- 로컬 우르수스 오버레이에 카셰이 / 영광과 번영 전략을 추가했다. 초기 HP 22, 우르수스 오퍼레이터 승급 시 현재 레벨업 비용 -2, 라운드당 최대 1회. 자동 합성과 승급 효과 모두 처리하며 비용은 0 미만으로 내려가지 않는다. 방장 커스텀 진영 설정이 꺼지면 서버와 전략 선택 UI에서 제외된다.
- 카셰이 이미지는 ArknightsAssets2의 공식 스토리 리소스 `avg_npc_060.png`를 사용한다. 메인 8-5 종료 스토리에서 카셰이 대사에 연결된 캐릭터임을 확인했다. 이미지 경로는 개발용 누락 리소스 다운로드 목록에도 포함된다.
- 같은 방의 관전자도 대기실/게임/결과 채팅에 참여할 수 있다. 서버가 관전자 여부와 닉네임을 결정하고 기록에 저장한다. 열린 채팅과 닫힌 채팅 미리보기 모두 닉네임 옆에 회색 `(관전자)` 표시를 렌더링한다. 새 관전자에게 기존 기록도 전달한다. 게임 조작은 여전히 관전자 권한으로 제한된다.
- 검증: 전략, 방 채팅, 커스텀 진영, 전략 선택, 기존 전략, 관전자 권한 관련 67개 테스트 통과. Chromium 채팅 테스트 1개 통과: 열린 창 및 미리보기에서 관전자 라벨과 실제 회색 색상 확인. 로컬 데이터·카셰이 이미지·공개 테스트 터널 HTTP 200 확인.
- 운영 사이트 업로드/커밋/푸시는 수행하지 않았다.

- 카셰이 전략 표시 보정: 공식 스토리 원화를 얼굴 중심으로 확대하고 기존 전략 초상화에 맞춘 어두운 청록색 홀로그램·주사선·가장자리 페이드를 BandIcon에 적용했다. 이미지 원본은 그대로 캐시하고 렌더링에서 공통 크기별 효과를 적용한다. 설명의 중복 효과명 접두부를 제거하고 진영 표기를 `<우르수스>`로 통일했다. 설명 문단 margin/padding/text-indent를 0으로 명시했다. Chromium 비교 화면에서 초상화와 설명 실제 렌더링 확인, 관련 전략 테스트 통과.

- 카셰이 초상화 재비교: 기존 전략 두 종류와 실제 브라우저에서 비교하여 사각형·상체 중심·어두운 회색 처리의 차이를 확인했다. 공식 카셰이 원화와 전략 아이콘을 기준으로 생성한 얼굴/목 중심 민트색 홀로그램 에셋 `kaschey-portrait-v2.png`로 교체했다. 원형 픽셀 외곽과 촘촘한 주사선은 에셋에 포함하고, 실제 전략 판넬의 어두운 가장자리 페이드 및 작은 문구를 표시한다. 경로를 변경하여 기존 스탠딩 이미지 캐시 재사용을 피하고 신규 이미지도 누락 리소스 다운로드 목록에 포함했다. 개발 리소스 핸들러는 해당 로컬 에셋을 직접 읽는다. Chromium에서 기존 두 전략과 나란히 표시하여 확인했다.

- 카셰이 초상화 v3: 사용자의 지적대로 원형 픽셀 외곽을 제거했다. 실제 브라우저의 기존 전략 두 초상화를 기준으로 사각형 암녹색 배경, 부드러운 가장자리 페이드, 얼굴 확대, 절제된 민트색 주사선으로 다시 생성했다. `kaschey-portrait-v3.png`로 교체하고 중복 CSS 필터/문구 오버레이는 제거했다. 신규 경로로 캐시 다운로드하며 브라우저에서 기존 초상화와 나란히 비교해 확인했다.

### 운영 전환 준비 (2026-10-05)

- 카셰이 설명을 사용자 지정 표기 `[영광과 번영]<우르수스> 오퍼레이터를 승급할 때마다 레벨업 비용 -2 (라운드당 최대 1회)`로 수정했다. 효과명 접두부를 복원하고 진영명은 꺾쇠를 유지한다.
- `tools/prepare-production.mjs ... --publish-data`는 현재 로컬 데이터 전체와 음성·스킨·스킬 사운드·로컬 아트 인덱스를 `content/production/`에 준비한다. `.cache`가 없는 EC2에서도 Docker 빌드가 `tools/apply-production.mjs`로 해당 데이터를 자동 적용한다. 기존 GitHub push → EC2 수동 `deploy/ec2/update.sh` 흐름을 유지한다.
- 9,411개 리소스 인덱스와 로컬 제공 파일 265개를 준비했다. 모든 assets.json 및 local-assets.json 참조가 인덱스에 포함되고 로컬 파일이 존재하는지 검증했다. 로컬 제공 파일도 운영 서비스 워커에서 동일 출처로 다운로드·캐시하도록 추가했다.
- 관련 테스트 8개 및 운영 카탈로그 검사 통과. 브라우저에서 신규 로컬 이미지 다운로드 후 재사용하고 기존 미러 파일은 다시 받지 않는 것을 확인했다.
- 실제 Docker production 이미지 `stronghold-local-production:review` 빌드 성공. Node 24 컨테이너에서 데이터·음성 목록·로컬 파일·카셰이 설명과 정상 서버 시작을 검증했다. 빌드 환경의 프록시 DNS 및 인증서 설정은 이 클라우드 환경에서만 사용했고 저장소/EC2 업데이트 명령에 추가하지 않았다.
- 운영 서버 교체와 Git 커밋/푸시는 아직 수행하지 않았다. 준비한 `content/production/`을 포함해 코드 변경을 master에 올린 뒤 기존 업데이트 명령을 실행해야 한다.

### Git 기반 운영 업데이트 공개 준비

- 운영 데이터 및 로컬 파일을 포함한 전체 변경을 커밋한다. 원격 master와 분기 충돌 없이 fast-forward로 반영할 수 있음을 확인했다.
- 전체 테스트에서 발견된 오래된 테스트 전제(기본 스킬 모두 S1, 부분 로컬 에셋을 전체 설치로 간주, AI가 이미 선택한 전략 재선택, 배치 순서를 무시한 즉시 배치)는 현재 게임 요구사항에 맞춰 수정했다. 해당 테스트 재실행 54개: 45개 통과, 전체 에셋 설치 전용 9개 건너뜀.
- 실제 대전 테스트의 기존 20 seed 실행은 모든 모드/협동 구성에서 통과했다. 변경된 테스트를 포함한 최종 전체 검사에는 MATCH_SEEDS=1을 사용한다.
- 최종 전체 검사 결과: 3,783개 중 3,760개 통과, 실패 0, 선택 실행/전체 에셋 설치 전용 23개 건너뜀 (MATCH_SEEDS=1). 로그: /tmp/production-push-final-suite.log.
