# 원본 0.2.1 릴리즈 사전 검토

검토 대상: `v0.2.1` (`c2a2ef778cf728ff29b953b9842b2a39b1e9cbea`), 원본 릴리즈 날짜 2026-10-07.
로컬 기준: `34009dc` 및 커밋하지 않은 사운드 타이밍 롤백·우르수스 제국 드론 보스 우선순위 수정.

## 현재 상태

이 문서는 적용 전 검토 기록이다. 이후 선택적 이식 결과는 [로컬 통합 결과](LOCAL-UPSTREAM-021-INTEGRATION-KO.md)에 정리했다. 커밋·푸시·운영 서버 변경은 하지 않았다.
`v0.1.4`와 비교하면 858개 파일 변경, 133,552줄 추가, 35,398줄 삭제다. 실제 공통 조상은 `bdb0765`이며, 현재 HEAD와의 가상 병합에서는 156개 파일의 충돌이 발생한다. 가상 병합은 작업 파일과 인덱스를 변경하지 않는다.

## 주요 변경과 로컬 대조

| 원본 변경 | 로컬 상태 / 통합 검토 사항 |
| --- | --- |
| 전투·매치·렌더러·화면 모듈 분리 | Battle, Match, fx, app, game과 tier별 스킬 파일이 충돌한다. 기존 커스텀 코드를 새 모듈로 옮기는 별도 이식과 회귀 검증이 필요하다. |
| 모든 오퍼레이터 풀잠재, 모듈 재능·소환물 재능 반영 | 로컬 데이터 빌더는 재능 후보에 잠재 0을 사용한다. 원본 데이터만 덮어쓰면 커스텀·선발 오퍼레이터가 누락될 수 있으므로 빌더에서 함께 재생성해야 한다. |
| 연합방어를 현재 라운드 맵으로 복구 | 로컬도 현재 라운드 지형을 사용한다. 0.2.0의 빈 템플릿 맵을 거쳐 적용하면 회귀하므로 최종 0.2.1 동작을 직접 대조해야 한다. |
| 기습의 양쪽 점유 전장 접근 규칙 | 1인 지원 제한, 대기석·임시 행 제외, 배치 즉시 스킬 및 재배치 발동을 함께 유지해야 한다. |
| 가득 찬 장비 슬롯에서 소모품도 교체 UI 사용 | 기존 일반 장비 교체와 겹친다. 소모품 성공·실패 시 파괴 순서 및 AI 선택을 추가 검증해야 한다. |
| Touch 3스킬의 확장 범위 발동 | 로컬의 일반화된 스킬 범위 조건과 중복 가능하다. 전략 소환물 경로까지 테스트해야 한다. |
| 괴사 중 저장된 충전까지 SP 감소 | 충전·과열·발동 중 표시 구현과 교차 검증이 필요하다. |
| 키아베 지급 직후 라플란드 특질 발동 방지 | PR 196 관련 기존 로컬 수정과 중복 여부를 실행 테스트로 확인해야 한다. |
| 타격 횟수형 적과 보스 소환물의 라운드 보정 | 기존 사용자 지정 인원·난이도·보스 HP 보정을 유지하면서 별도 적용해야 한다. |
| 공중 유닛 고정 높이 및 적 전용 애니메이션 | 기존 공중 상위 렌더링·이동속도 비례 애니메이션과 결합해야 한다. |
| 맹약 접기 화살표 | 사용자가 접기 UI 제거를 요청했으므로 그대로 도입하지 않는다. |
| 선발 오퍼레이터 목록·관전 정보 개선 | 기존 5명 선발, 밴 제외, 스킨·스킬 저장과 원본 새 DIY 구조의 차이가 크다. |
| 공식 배포 ZIP의 MANIFEST 검증 | 커스텀 파일에 공식 배포 검증을 강제하지 않는다. 기존 Git 수동 업데이트 방식을 유지한다. 공식 0.2.1 update.zip은 원본 0.2.0 배포본용이다. |

## 보존 대상

우르수스 및 카셰이, 선발 오퍼레이터, 한국어 번역, 스킬·스킨 설정 저장, 음성 언어·캐시, 채팅, 명일방주 맵, 기존 이펙트·공격 타이밍, 관전, 사용자 지정 HP 보정, 최근 사운드 롤백 및 제국 드론 보스 우선순위.

## 가상 병합 충돌 목록

아래는 Git 출력 그대로이며 실제 작업 파일에 충돌 마커를 넣은 것은 아니다.

```text
CONFLICT (content): Merge conflict in CHANGELOG.md
CONFLICT (content): Merge conflict in README.md
CONFLICT (content): Merge conflict in data/assets.json
CONFLICT (content): Merge conflict in data/bonds.json
CONFLICT (content): Merge conflict in data/chess.json
CONFLICT (content): Merge conflict in data/config.json
CONFLICT (content): Merge conflict in docs/ASSETS.md
CONFLICT (content): Merge conflict in docs/DEPLOY.md
CONFLICT (content): Merge conflict in docs/DESIGN.md
CONFLICT (content): Merge conflict in docs/META.md
CONFLICT (content): Merge conflict in docs/PLAYING.md
CONFLICT (content): Merge conflict in docs/SIM.md
CONFLICT (content): Merge conflict in docs/research/02-bonds.json
CONFLICT (content): Merge conflict in docs/research/02-bonds.md
CONFLICT (content): Merge conflict in package-lock.json
CONFLICT (content): Merge conflict in package.json
CONFLICT (content): Merge conflict in public/css/screens/game.css
CONFLICT (content): Merge conflict in public/css/screens/room.css
CONFLICT (content): Merge conflict in public/css/screens/title.css
CONFLICT (content): Merge conflict in public/js/audio.js
CONFLICT (content): Merge conflict in public/js/battle/observe.js
CONFLICT (content): Merge conflict in public/js/data.js
CONFLICT (content): Merge conflict in public/js/main.js
CONFLICT (content): Merge conflict in public/js/render/app.js
CONFLICT (content): Merge conflict in public/js/render/fx.js
CONFLICT (content): Merge conflict in public/js/render/interp.js
CONFLICT (content): Merge conflict in public/js/render/spine.js
CONFLICT (content): Merge conflict in public/js/render/style.js
CONFLICT (content): Merge conflict in public/js/render/textures.js
CONFLICT (content): Merge conflict in public/js/render/units.js
CONFLICT (content): Merge conflict in public/js/screens/bandDraft.js
CONFLICT (content): Merge conflict in public/js/screens/briefing.js
CONFLICT (content): Merge conflict in public/js/screens/game.js
CONFLICT (content): Merge conflict in public/js/screens/loadout.js
CONFLICT (content): Merge conflict in public/js/screens/lobby.js
CONFLICT (content): Merge conflict in public/js/screens/room.js
CONFLICT (content): Merge conflict in public/js/screens/title.js
CONFLICT (content): Merge conflict in public/js/ui/bondStrip.js
CONFLICT (content): Merge conflict in public/js/ui/combatHud.js
CONFLICT (content): Merge conflict in public/js/ui/detailPanel.js
CONFLICT (content): Merge conflict in public/js/ui/emotes.js
CONFLICT (content): Merge conflict in public/js/ui/enemyDrawer.js
CONFLICT (content): Merge conflict in public/js/ui/gameComponents.js
CONFLICT (content): Merge conflict in public/js/ui/gameLogic.js
CONFLICT (content): Merge conflict in public/js/ui/hud.js
CONFLICT (content): Merge conflict in public/js/ui/matchChrome.js
CONFLICT (content): Merge conflict in public/js/ui/matchInfo.js
CONFLICT (content): Merge conflict in public/js/ui/settings.js
CONFLICT (content): Merge conflict in public/js/ui/shopBar.js
CONFLICT (content): Merge conflict in public/js/ui/teamPanel.js
CONFLICT (content): Merge conflict in public/js/ui/underframe.js
CONFLICT (content): Merge conflict in server/index.js
CONFLICT (content): Merge conflict in server/lobby.js
CONFLICT (content): Merge conflict in server/match/Match.js
CONFLICT (content): Merge conflict in server/match/PlayerState.js
CONFLICT (content): Merge conflict in server/match/audit.js
CONFLICT (content): Merge conflict in server/match/board.js
CONFLICT (content): Merge conflict in server/match/bondsMeta.js
CONFLICT (content): Merge conflict in server/match/bot.js
CONFLICT (content): Merge conflict in server/match/builtinMeta.js
CONFLICT (content): Merge conflict in server/match/choices.js
CONFLICT (content): Merge conflict in server/match/effectsMeta.js
CONFLICT (content): Merge conflict in server/match/fields.js
CONFLICT (content): Merge conflict in server/match/finalAssault.js
CONFLICT (content): Merge conflict in server/match/gamedata.js
CONFLICT (content): Merge conflict in server/match/invariants.js
CONFLICT (content): Merge conflict in server/match/pool.js
CONFLICT (content): Merge conflict in server/match/unite.js
CONFLICT (content): Merge conflict in server/net.js
CONFLICT (content): Merge conflict in server/sim/Battle.js
CONFLICT (content): Merge conflict in server/sim/ai.js
CONFLICT (content): Merge conflict in server/sim/content/bands/meta.js
CONFLICT (content): Merge conflict in server/sim/content/bonds/core.js
CONFLICT (content): Merge conflict in server/sim/content/bosses.js
CONFLICT (content): Merge conflict in server/sim/content/devices.js
CONFLICT (content): Merge conflict in server/sim/content/enemies.js
CONFLICT (content): Merge conflict in server/sim/content/garrisons/battle.js
CONFLICT (content): Merge conflict in server/sim/content/garrisons/meta.js
CONFLICT (content): Merge conflict in server/sim/content/generic.js
CONFLICT (content): Merge conflict in server/sim/content/index.js
CONFLICT (modify/delete): server/sim/content/kits/tier1.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier1.js left in tree.
CONFLICT (modify/delete): server/sim/content/kits/tier2.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier2.js left in tree.
CONFLICT (modify/delete): server/sim/content/kits/tier3.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier3.js left in tree.
CONFLICT (modify/delete): server/sim/content/kits/tier4.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier4.js left in tree.
CONFLICT (modify/delete): server/sim/content/kits/tier5.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier5.js left in tree.
CONFLICT (modify/delete): server/sim/content/kits/tier6.js deleted in v0.2.1 and modified in HEAD.  Version HEAD of server/sim/content/kits/tier6.js left in tree.
CONFLICT (content): Merge conflict in server/sim/content/tokens.js
CONFLICT (content): Merge conflict in server/sim/damage.js
CONFLICT (content): Merge conflict in server/sim/professions.js
CONFLICT (content): Merge conflict in server/sim/simdata.js
CONFLICT (content): Merge conflict in server/sim/skills.js
CONFLICT (content): Merge conflict in server/sim/snapshot.js
CONFLICT (content): Merge conflict in server/sim/spec.js
CONFLICT (content): Merge conflict in server/sim/targeting.js
CONFLICT (content): Merge conflict in shared/constants.js
CONFLICT (add/add): Merge conflict in shared/highGround.js
CONFLICT (content): Merge conflict in shared/protocol.js
CONFLICT (content): Merge conflict in test/content/bands.test.js
CONFLICT (content): Merge conflict in test/content/bonds_addon.test.js
CONFLICT (content): Merge conflict in test/content/bonds_core.test.js
CONFLICT (content): Merge conflict in test/content/enemies_bosses.test.js
CONFLICT (add/add): Merge conflict in test/content/feedback4-egir-unite.test.js
CONFLICT (content): Merge conflict in test/content/garrisons_battle.test.js
CONFLICT (content): Merge conflict in test/content/kits_alt_t4.test.js
CONFLICT (content): Merge conflict in test/content/kits_t3.test.js
CONFLICT (content): Merge conflict in test/docs-consistency.test.js
CONFLICT (add/add): Merge conflict in test/e2e/client-wait.test.js
CONFLICT (add/add): Merge conflict in test/golden.test.js
CONFLICT (add/add): Merge conflict in test/golden/README.md
CONFLICT (add/add): Merge conflict in test/golden/bonds.json
CONFLICT (add/add): Merge conflict in test/golden/fields.json
CONFLICT (add/add): Merge conflict in test/golden/matches.json
CONFLICT (add/add): Merge conflict in test/golden/roster.json
CONFLICT (content): Merge conflict in test/lobby.test.js
CONFLICT (content): Merge conflict in test/match/balance.test.js
CONFLICT (content): Merge conflict in test/match/bosshp.test.js
CONFLICT (content): Merge conflict in test/match/connection.test.js
CONFLICT (content): Merge conflict in test/match/feedback1-gaps.test.js
CONFLICT (content): Merge conflict in test/match/feedback1-meta.test.js
CONFLICT (add/add): Merge conflict in test/match/feedback3-unitecarry.test.js
CONFLICT (content): Merge conflict in test/match/finalAssault.test.js
CONFLICT (content): Merge conflict in test/match/harness.js
CONFLICT (content): Merge conflict in test/match/lobby-integration.test.js
CONFLICT (content): Merge conflict in test/match/merge.test.js
CONFLICT (content): Merge conflict in test/match/playtest6-bosspool.test.js
CONFLICT (content): Merge conflict in test/match/playtest6-matchflow.test.js
CONFLICT (add/add): Merge conflict in test/match/prep-bench.test.js
CONFLICT (add/add): Merge conflict in test/match/prep-watch.test.js
CONFLICT (add/add): Merge conflict in test/match/spectator.test.js
CONFLICT (add/add): Merge conflict in test/render/feedback3-shot-height.test.js
CONFLICT (add/add): Merge conflict in test/render/feedback3-skill-idle.test.js
CONFLICT (add/add): Merge conflict in test/render/feedback4-texas-skill-clip.test.js
CONFLICT (content): Merge conflict in test/render/unitview.test.js
CONFLICT (add/add): Merge conflict in test/sim/feedback3-cold-freeze.test.js
CONFLICT (add/add): Merge conflict in test/sim/feedback3-ulpia-move.test.js
CONFLICT (add/add): Merge conflict in test/sim/raid-terrain.test.js
CONFLICT (content): Merge conflict in test/sim/skills.test.js
CONFLICT (content): Merge conflict in test/static-local-art.test.js
CONFLICT (content): Merge conflict in test/ui/audio.test.js
CONFLICT (add/add): Merge conflict in test/ui/bond-collapse.e2e.test.js
CONFLICT (content): Merge conflict in test/ui/feedback1b-bonds.test.js
CONFLICT (content): Merge conflict in test/ui/gameLogic.test.js
CONFLICT (add/add): Merge conflict in test/ui/playtest-item-detail.test.js
CONFLICT (content): Merge conflict in test/ui/playtest3.test.js
CONFLICT (add/add): Merge conflict in test/ui/prep-bench.test.js
CONFLICT (add/add): Merge conflict in test/ui/teammate-band.test.js
CONFLICT (add/add): Merge conflict in test/ui/terrain-tip.e2e.test.js
CONFLICT (content): Merge conflict in test/ui/watch-bonds.test.js
CONFLICT (content): Merge conflict in test/version.test.js
CONFLICT (content): Merge conflict in tools/assets/anim-roles.mjs
CONFLICT (content): Merge conflict in tools/assets/downloader.mjs
CONFLICT (content): Merge conflict in tools/assets/plan.mjs
CONFLICT (content): Merge conflict in tools/build-data.mjs
CONFLICT (content): Merge conflict in tools/fetch-assets.mjs
CONFLICT (add/add): Merge conflict in tools/golden.mjs
CONFLICT (content): Merge conflict in tools/local-extract/extract.py
```
