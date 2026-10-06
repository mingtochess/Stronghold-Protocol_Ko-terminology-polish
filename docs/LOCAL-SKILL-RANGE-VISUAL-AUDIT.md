# 스킬 범위 색상 및 스타일 근거 (로컬, 2026-10-06)

우선순위: 확인된 원작 스킬 연출 → 오퍼레이터 대표색과 기본 반투명 채움·안쪽 점선 윤곽. 빗금은 사용하지 않는다. 스킬별 키는 snapshot의 skillId이며 이전 snapshot은 charId+skillIndex로 동일 키를 복원한다. 스킨 변경만으로 범위 색상이 임의로 바뀌지 않는다.

## 확인 방법과 한계

PRTS의 스즈란 페이지와 Arknights Terra Wiki API에서 사용 자료를 검색했다. PRTS는 스킬 수치·범위를 제공하지만 해당 페이지에 사용 장면 GIF가 없었다. Google은 redirect 안내만, YouTube 검색 요청은 실패했으며 Bing은 관계없는 검색 결과를 반환했다. 영상을 직접 비교했다고 주장하지 않는다.

대신 원작 에셋 레포지토리의 [hot_update_list.json](https://github.com/ArknightsAssets/ArknightsAssets2/blob/cn/bundles/hot_update_list.json)을 검색하여 스킬 이펙트 bundle을 찾았다. 레포지토리의 기존 다운로드 방식으로 공식 CDN에서 받고 인덱스 MD5를 대조했다. UnityPy + 기존 LZ4AK 디코더로 ParticleSystem, Transform, Renderer, Material, Texture2D를 읽고 **기본 스킨의 해당 skill range prefab** 하위 색상 및 재질을 분석했다. 스킨/다른 스킬 재질은 제외했다. 원작 텍스처 비교판은 `/workspace/artifacts/skill-vfx-reference/`에 저장했다.

| 스킬 | 확인한 원작 요소 | 적용 |
|---|---|---|
| 스즈란 S3 | lisa_skill_03_range의 lisa_07/08 재질 RGB(0,.312,.743), 짙은 청색 andi(.0,.133,.316), 불꽃·별 입자 | 읽기 쉬운 청색 #4d9bdd, 낮은 농도의 안개 경계와 느린 농도 변화 |
| 민트 S1/S2 | mint_skill_02_range huan_01 청록(.019,.494,.515), mx_kuo 청록(0,1,1), 청색 별 입자 | #50d8ee, 청록빛의 약한 맥동 경계 |
| 사리아 S3 | demkni_skill_03_range fanweiquan/fanwei 회색 재질, yanwu 먼지, 흰 번개 | #c1bfbd, 회백색 저농도 채움, 깜박임 없음 |
| 무에나 S3 | mlynar_skill_03_range_01와 buff_03 황금빛/노란 huan, 금빛 검광 | 기존 노란색 #f1c64f 유지, 약한 금빛 경계 |
| 모스티마 S2/S3 | mostma_skill_02/03_range 청색 재질, S3 shizhong 시계 요소 | #4989ed, 낮은 농도의 청색 경계 |

이는 원작 이펙트를 그대로 렌더링하는 Unity 파티클 이식이 아니라, 전장 가독성을 유지하는 **범위 표시의 색감·농도 조정**이다. 시계/소용돌이 등의 모든 원작 파티클을 복제한 상태는 아니다. 확인하지 않은 다른 스킬에 원작 색상을 추정하여 지정하지 않았다. 실버애쉬는 해당 bundle에 기본 스킨 S3 range prefab이 확인되지 않아 대표색/현재 표시를 유지한다.

## 검증

실제 스즈란 S3, 민트 S2, 사리아 S3 데이터와 Spine를 로드한 Chromium 범위 겹침 캡처 두 장. 렌더 테스트는 스킬별 우선순위, 다른 스킬에 적용되지 않는 점, 스킨 안정성, 빗금 부재를 검증한다. 보스전 속도와 시간 초과 계산은 별도 boss-speed 테스트 및 기존 boss 회귀로 확인한다. 운영 배포하지 않았다.

## 나머지 후보 검토 완료 (2026-10-06)

[나머지 스킬별 적용 목록](LOCAL-REMAINING-SKILL-RANGES-KO.md)에 현재 로컬의 368개 스킬 선택지를 바탕으로 선정한 범위 관련 후보 105개를 모두 기록했다. 23개 추가 프로필, 기존 7개를 합쳐 30개에 원작 스킬 색감을 적용했다. 중립/혼합/작은 강조색만 있거나 전용 스킬 prefab을 특정할 수 없는 나머지 75개는 대표색 fallback이다. 정확한 실전 영상의 픽셀 비교가 완료되었다는 뜻은 아니다.

원작 연출의 작은 시작/타격 색상만 확대해 범위 전체를 칠하는 것을 피했다. 예를 들어 실버애쉬는 빨간 시작 재질이 일부 있지만 흰 검광 전체를 빨갛게 바꾸지 않았다. 자동 추출은 검토 후보일 뿐, 최종 렌더 프로필과 다를 수 있다. 단일 색상과 반복 range/buff/trail 요소가 함께 확인된 경우에만 추가했다. 강도는 전장 가독성을 위해 조정했다. 첸 더 던스트릭 S3는 어두운 지면색 평균 대신 금빛 파편에 맞춰 밝게 조정했다.

새 캡처는 `remaining-range-arts.png`, `remaining-range-melee.png`, `remaining-range-fallback.png`이다. 실제 모델과 현재 스킬 데이터·rangeExtend 함수를 사용한 통제된 Chromium 렌더 테스트이며 랜덤 실전 플레이가 아니다.
