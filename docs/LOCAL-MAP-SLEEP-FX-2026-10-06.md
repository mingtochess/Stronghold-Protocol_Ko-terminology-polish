# 로컬 검토: 맵·전용 이펙트·기습 배치·티티 수면

2026-10-06. 로컬 적용이며 커밋·푸시·운영 배포는 하지 않았다. 앞선 18개 요청의 내역은 [기존 검토 문서](LOCAL-REVIEW-2026-10-06.md)를 참조한다.

## 맵별 실제 화면

앞서 제시했던 `map-*.png` 화면은 웹 프로젝트의 재구성 맵이었다. 이를 명일방주의 원본 맵 적용 증거로 설명한 것은 잘못된 판단이며, 아래 `map-original-*.png` 자료로 교체한다.

원본 출처는 Stronghold 저장소가 아니라 [ArknightsAssets/ArknightsAssets2](https://github.com/ArknightsAssets/ArknightsAssets2/tree/cn)이다. 현재 인덱스에는 행사 장면이 빠져 있어, [2026-04-14의 고정 인덱스](https://github.com/ArknightsAssets/ArknightsAssets2/blob/7ddea107cef9ab24d55052f36bf984fcd1bff9ed/bundles/hot_update_list.json)를 이용했다. 해당 인덱스의 공식 CDN 버전 `26-04-14-11-12-01_cf554f`에서 11개 `scenes/activities/act{1,2}autochess/level_.../*.ab` 및 대응하는 리소스를 받았고, 번들의 MD5를 검증했다. 의존 관계는 같은 버전의 번들 인덱스 `.idx`에서 확인했다.

**실제 적용:** 타일·주변 지형·구조물의 원본 메시, 원본 UV, 오브젝트 계층/배치, Unity 정적 배칭의 오브젝트별 서브메시를 보존했다. 기존의 재구성 보드 메시를 함께 겹쳐 그리지 않는다. 각 전장 33,044~97,973개 삼각형, 총 479,365개를 변환했다. 원본 자료는 리소스 다운로드 목록에 포함되며, 변환 버전이 포함된 파일명으로 이전 캐시와 구분하며, 압축 파일을 캐시하고 현재/직전 두 전장만 디코딩된 상태로 보관한다.

**남은 차이:** Unity의 전용 지형 혼합·물·광원/후처리 셰이더와 라이트맵을 그대로 실행하는 것은 아니다. 표시용 셰이더는 three.js로 대응하며, 움직이는 물·게이트·게임 내 장치는 기존 웹 경로를 이용한다. 원본의 `Waterplane` 노드는 메시를 유지하고 물 셰이더로 대응해 저장된 녹색 텍스처가 그대로 표시되지 않도록 했다. 원본 메시 적용 완료와 원작 렌더링 완전 재현을 구분해야 한다. 아래 자료는 정적 화면 검증이며 침수·모래폭풍의 전체 시간 변화 검증을 뜻하지 않는다.

[11종 전체 비교](/workspace/artifacts/map-original-types-overview.png)

| 전장 | 화면 |
| --- | --- |
| 전장 01 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m01.png) |
| 전장 02 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m02.png) |
| 전장 03 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m03.png) |
| 활성 오리지늄 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m04.png) |
| 침수·수상 플랫폼 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m05.png) |
| 모래폭풍·토석 구조물 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m06.png) |
| 수풀 | [스크린샷](/workspace/artifacts/map-original-act1autochess_m07.png) |
| 오리지늄 흐름 발생장치 | [스크린샷](/workspace/artifacts/map-original-act2autochess_m01.png) |
| 늪지 제어 | [스크린샷](/workspace/artifacts/map-original-act2autochess_m02.png) |
| 배기 격자 | [스크린샷](/workspace/artifacts/map-original-act2autochess_m03.png) |
| 침수 제어 | [스크린샷](/workspace/artifacts/map-original-act2autochess_m04.png) |

## 전용 에셋 적용

[적용 화면](/workspace/artifacts/dedicated-skill-effects.png). 아래에서 위로 첸·티티·위셔델·나란투야다. 원본 번들의 실제 프리팹→머티리얼→`_MainTex` 연결을 따라 에셋을 확인했다.

| 오퍼레이터 / 적용 시점 | 원본 프리팹 / 텍스처 | 적용 |
| --- | --- | --- |
| 첸 더 던스트릭 S3 발동 | `chen3_skill_03_trail_01` / `chen3_04` | 원본 `chenlong` 메시의 1,846개 삼각형과 UV로 용 이미지를 구성하고 배치 방향으로 진행하는 용 검기 추가 |
| 티티 S3 공격 | `titi_skill_03_trail_01` / `special_object_titi_06` | 전용 금빛 꿈 투사체 |
| 위셔델 공격 | `wisdel_attack_01_trail`, `wisdel_skill_03_trail` / `wisdel_03` | 전용 포탄 머리, 기존 포물선과 충돌 타이밍 유지 |
| 나란투야 S3 공격 | `narant_skill_03_trail_01` / `narant_weapon01` | 회전·복귀하는 전용 칼날, 원본 텍스처 해상도에 따라 크기를 정규화 |

5명(아스카론 포함)의 전용 번들에서 텍스처 94개를 추출했다. 아스카론은 이번에 전용 렌더링 연결까지 완료하지 않았고, 전 오퍼레이터의 모든 전용 Unity 파티클을 이식한 상태도 아니다. Unity의 디졸브/왜곡 셰이더를 포함한 원작 연출 전체와 같다고 주장하지 않는다.

`tools/fetch-battle-bundles.py`, `tools/local-extract/extract.py`, `tools/local-extract/bake-dedicated.py`, `tools/setup-battle-assets.mjs`에 다운로드·추출·UV 구성 절차를 저장했다. 로컬 에셋 매니페스트와 미리보기 패치 리소스 목록에 등록해 브라우저 캐시 경로에 포함했다. 새 리소스가 아직 없는 동안에는 기존 투사체를 유지한다.

출처: [ArknightsAssets2 CN 번들 목록](https://github.com/ArknightsAssets/ArknightsAssets2/tree/cn/bundles), 버전 `26-09-22-07-47-20_6c71fa`.

## 티티 수면

[PRTS 티티](https://prts.wiki/w/缇缇)의 스킬 설명과 비고를 대조했다.

- S1: 이미 잠든 적에게도 확률 판정 후 수면을 갱신할 수 있어야 하는데, 기존 코드는 이를 막았다. 해당 조건을 제거했다.
- S2: 원작은 0.1초마다 0.3초 수면을 갱신한다. 기존 0.25초마다 0.5초를 원작 수치로 변경했다. 저항 50%에서도 매 틱 수면이 유지되는지 확인했다.
- S2: 아군의 ‘낮잠’이 해제되어도 수면 오라는 남아야 한다. 낮잠 버프 유무로 오라를 중단하던 조건을 제거했다. 티티의 퇴각/스킬 종료 시에는 중단한다.
- S3: 일반/정예, 저항 없음/50% 각각에서 수면 시간이 설정값대로 유지되고 각성 피해가 그 이후에 나오는지 검증했다. 티티의 공격·재능 지속 피해로 수면이 즉시 해제되는 현상은 재현되지 않았다.
- 수면 면역은 그대로 유지한다. 수면 시간은 게임 시간이며 2배속에서는 실제 경과 시간이 절반이다. 제보의 정확한 스킬/적/저항 조건이 없어 ‘모든 즉시 해제 제보의 원인을 확정했다’고 하지는 않는다.

## 기습 배치

실제 데이터의 선택 가능한 `activateOnDeploy` 스킬들을 초기 배치와 기습과 같은 `retreat(reason: raid)` → 무료 재배치(`keepSp`) 경로로 실행했다. 배치 애니메이션 종료 후 재발동을 확인했고, 기존 기습 착지·SP 보존 테스트도 통과했다. 이번 점검에서는 해당 경로의 추가 구현 수정이 필요하지 않았다. 커스텀 테스트 스킬만으로 확인한 것이 아니라 실제 오퍼레이터의 선택 스킬을 순회했다.

## 반복 스파인 잔상 제보

[휴식 화면 검증](/workspace/artifacts/spine-ghost-regression.png).

공유 스파인 아틀라스는 이전 프레임을 부분 삭제하고 여러 모델을 함께 그리므로 잔상/클리핑 간섭 가능성이 있다. 휴식 화면에서는 공유 아틀라스를 우회해 직접 렌더링하도록 바꿨다. 전투의 클리핑 모델은 매 프레임 지우는 개별 렌더 타깃으로 분리했다. 고부하에서도 휴식 모델이 공유 버퍼에 들어가지 않고, 클리핑 전투 모델의 개별 타깃이 항상 `clear: true`인지 회귀 테스트로 확인했다.

민트·프틸롭시스·퍼퓨머·이네스·모스티마를 600프레임 갱신한 화면에서 반복 잔상과 브라우저 오류는 없었다. 제보의 정확한 환경을 재현하지 못했으므로 원인을 확정한 수정으로 표현하지 않는다. 클리핑 모델이 많은 전투에서는 개별 타깃 때문에 렌더링 비용이 증가할 수 있다.

## 검증

- 관련 시뮬레이션/기습/배치/선발/수면/렌더링 테스트 254개 통과.
- 추가 클리핑 격리 회귀 테스트 포함 UnitView 테스트 34개 통과.
- 추가 일반·정예 S3 실제 수면 지속시간 회귀 테스트 포함 Tier5 테스트 52개 통과.
- 맵 11종, 전용 이펙트, 휴식 스파인 600프레임 브라우저 검증: JavaScript 오류 0.
- 전체 테스트 모음을 이번 변경 후 다시 실행한 것은 아니다.

## 모바일 스파인 겹침 제보

휴식/미리보기에서는 공유 렌더 텍스처를 사용하지 않는다. 클리핑이 있는 스파인은 별도로 지우는 렌더 텍스처로 격리했다. 추가로 모바일의 혼잡 렌더링에서도 공유 아틀라스를 사용하지 않고 캐릭터별 렌더 텍스처를 `clear: true`로 갱신하도록 우회했다. 모바일 GPU의 부분 지우기/마스크 간섭 가능성을 줄이는 조치이며, 제보의 정확한 기기 GPU에서 원인을 확정한 것은 아니다.

Android 사용자 에이전트·터치·960×540·기기 배율 3·저품질 조건으로 준비 화면과 강제 혼잡 경로를 각각 600프레임 확인했다. 5종 스파인이 모두 로드됐고 JS 오류가 없었다. 혼잡 경로에서 5개 모두 개인 렌더 텍스처를 사용하고 공유 슬롯은 없었다. 실제 휴대폰 GPU를 사용한 검증은 남아 있다.

- [모바일 준비 화면](/workspace/artifacts/spine-ghost-mobile-regression.png)
- [모바일 혼잡 경로](/workspace/artifacts/spine-ghost-mobile-crowded.png)
- 관련 렌더링·스킬·수면·배치 테스트: 228개 통과, 실패/건너뛰기 없음.

재현 가능한 준비: `python3 tools/fetch-original-map-bundles.py` 후 `.cache/battle-extract-venv/bin/python tools/local-extract/extract-original-maps.py`. 일반 에셋 준비 명령 `node tools/setup-battle-assets.mjs`에도 같은 과정을 연결했다. 내려받은 에셋은 로컬 생성물이며 커밋·푸시·운영 배포하지 않았다.

## 추가 수정: 전장 바닥이 어두웠던 조명 누락

이후 실제 PRTS 맵 스크린샷과 대조해 누락된 라이트맵·UV2·감마 계산을 복원했다. 조명용 UV가 없는 타일도 기본 좌표에 원본 ST offset을 적용한다. 장면별 원본 주광을 사용하며, 장애물은 실제 `trap_1105_accrate` 메시/UV/텍스처로 교체했다. 장면 파일은 `*-v8.json.gz`, 재질은 `materials-v9.json`이다. 과도한 광원 증폭과 비활성 지형 전체 제외 실험은 최종 적용하지 않았다.

최종 맵 11종 브라우저 렌더에서 JS/콘솔 오류가 없었고 관련 테스트 45개가 통과했다. [원본·수정 전·수정 후 비교](/workspace/artifacts/map-lighting-comparison.png), [맵 11종 최종 캡처](/workspace/artifacts/map-lighting-final-overview.png), [상세 원인과 수정 기록](LOCAL-MAP-LIGHTING-REVIEW-2026-10-06.md)을 참고한다.
