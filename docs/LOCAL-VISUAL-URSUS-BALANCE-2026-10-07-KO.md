# 로컬 시각 효과·우르수스 조정 (2026-10-07)

현재 변경은 로컬 테스트에만 적용했다. 커밋·푸시·운영 배포는 하지 않았다. 기존 변경과 사용자 스킬·스킨 저장 설정을 유지한다.

## 우르수스 계산

중첩 수를 L이라고 할 때 3명 효과의 공격력·최대 HP 증가율은 `20% + L × 1%p`이다. 제국 드론과 우르수스 오퍼레이터 모두에게 적용한다. 드론의 기존 이동 속도 +50%는 유지한다.

6명 효과에서 제국 드론만 공격 속도 +50을 받으며 은신 감지를 유지한다. 드론은 살아서 배치되어 있는 같은 플레이어의 우르수스 오퍼레이터의 실제 총 공격력 합계에 `5% + L × 0.02%p`를 곱한 값을 기본 공격력으로 얻는다. 대기석·퇴각·다른 플레이어의 오퍼레이터는 제외한다.

획득한 공격력은 3명 효과보다 먼저 더한다. 우르수스 효과만 적용한 계산은 다음과 같다.

```
오퍼레이터 실제 공격력 합계 = A
획득 기본 공격력 = A × (0.05 + L × 0.0002)
드론 공격력 = (드론 원래 기본 공격력 + 획득 기본 공격력)
             × (1 + 0.20 + L × 0.01)
```

예: L=10, 원래 기본 공격력 1,000, 기본 공격력 500인 우르수스 오퍼레이터 6명 → 각 오퍼레이터 공격력 650, 합계 3,900, 획득량 202.8, 드론 공격력 **1,563.64**. 오퍼레이터의 공격력 버프·퇴각에 따라 갱신하며 드론의 자체 공격력을 합계에 넣지 않아 순환 증폭이 발생하지 않는다.

| 오퍼레이터 | 변경 |
| --- | --- |
| 로사 | 6단계로 변경. 활성화된 우르수스 3중첩당 공격력 +1%, 정예 +2% |
| 지마 더 레이징 타이드 | 5단계로 변경. 기본 스킬 3스킬. 휴식 기간 진입·종료 시 중첩 +6, 정예 +12 |
| 헬라그 | 활성화된 우르수스 3중첩당 공격 속도 +2, 정예 +4 |

희귀도 변경은 로사와 지마의 교환으로 해석했다. 정예 특질은 기존의 두 배 증가 형식을 유지했다. 기본 스킬 변경은 기존에 사용자가 저장한 스킬 선택을 초기화하지 않는다.

## 화면·렌더링 변경

| 요청 | 적용 내용 | 확인 |
| --- | --- | --- |
| 적 미리보기 전환 끊김 | 일반 전장과 미리보기 타일을 함께 유지. 보스 준비 화면에서도 전장·미리보기 유지 | 일반 전환 4회와 보스 준비 전환 3회에서 BoardScene.setStage 재생성 0회 |
| 화면 상하단 그라데이션 | 그라데이션 복원, HUD보다 낮은 렌더링 순서 | 실제 ShopBar 브라우저 화면에서 z-index 1 / HUD 3 |
| 상점·카메라 | 상점 카드 높이 2.24→2rem, 초상화 소폭 상승, 준비 화면 카메라를 줄어든 높이만큼 위로 이동 | 실제 상점 컴포넌트 화면 및 카메라 여백 검사 |
| 배치 커서 기준 | 모델 발 위치가 커서에 오도록 보정 | 브라우저 투영 좌표와 커서 간 차이 0.04타일 |
| 맵 오른쪽 불필요한 면 | 비활성 구역의 낮은 바닥 면을 배경으로 오인하던 예외 제거. 실제 외부 배경과 협동전 구역 유지 | 원본 맵 11종 캡처, 비활성 바닥·외부 배경 구분 회귀 검사 |
| 스킬 색상·컨셉 | 주요 오퍼레이터별 팔레트·모티프, 스킬 이름과 효과에 따른 독·냉기·화염·물·바람·시간 등의 표현. 나머지는 대표 일러스트 색 사용 | 무에나·모스티마·스즈란 겹침 범위 캡처 |
| 투사체 크기 | 일반 투사체를 최근 전체 확대 전 값으로 복원(1.8). 포물선 투사체만 2.4 유지 | 실제 화면 및 일반/곡사 크기 회귀 검사 |
| 적 투사체 색 | 적 아이콘에서 추출한 색을 투사체·꼬리·발사 효과에 적용 | 실제 적 아이콘 색 추출 브라우저 확인 |
| 장판 원 윤곽선 | 고정 해상도 원 이미지 대신 투영 크기에 맞춘 벡터 윤곽선 사용 | 확대된 장판 캡처 |

스킬 스타일은 주요 오퍼레이터에 명시적인 설정을 적용하고 그 외에는 이름·효과·일러스트를 이용한다. 모든 오퍼레이터의 원작 전용 이펙트를 개별적으로 복제한 것은 아니다. 전환 시 정적 맵 재생성은 제거했지만 기기별 전체 프레임 성능을 보장하는 측정은 아니다. 원본 맵의 그림자·라이트맵은 유지했다.

## 확인용 스크린샷

- [스킬 범위·색상 겹침](/workspace/artifacts/visual-themed-skill-ranges.png)
- [일반·곡사 투사체](/workspace/artifacts/visual-projectiles-restored-and-lob.png)
- [장판 벡터 윤곽선](/workspace/artifacts/visual-vector-ground-zone.png)
- [상점·HUD·그라데이션](/workspace/artifacts/visual-shop-compact-gradient.png)
- [커서 발 위치](/workspace/artifacts/visual-drag-feet-anchor.png)
- [적 미리보기](/workspace/artifacts/visual-enemy-preview.png)

### 맵별 캡처

- [act1autochess_m01](/workspace/artifacts/map-right-review-act1autochess_m01.png)
- [act1autochess_m02](/workspace/artifacts/map-right-review-act1autochess_m02.png)
- [act1autochess_m03](/workspace/artifacts/map-right-review-act1autochess_m03.png)
- [act1autochess_m04](/workspace/artifacts/map-right-review-act1autochess_m04.png)
- [act1autochess_m05](/workspace/artifacts/map-right-review-act1autochess_m05.png)
- [act1autochess_m06](/workspace/artifacts/map-right-review-act1autochess_m06.png)
- [act1autochess_m07](/workspace/artifacts/map-right-review-act1autochess_m07.png)
- [act2autochess_m01](/workspace/artifacts/map-right-review-act2autochess_m01.png)
- [act2autochess_m02](/workspace/artifacts/map-right-review-act2autochess_m02.png)
- [act2autochess_m03](/workspace/artifacts/map-right-review-act2autochess_m03.png)
- [act2autochess_m04](/workspace/artifacts/map-right-review-act2autochess_m04.png)

## 검증

관련 Node 검사 222개 통과, 실패 0개. 우르수스 기본 공격력 획득과 3명 효과의 시너지, 전투 중 버프·퇴각 갱신, 협동전 소유자 분리, 특질·데이터, 투사체, 카메라, 맵 클리핑을 포함한다. 브라우저에서 맵 11종과 실제 상점 컴포넌트, 투사체·범위·장판·배치 커서를 확인했고 해당 캡처 검사에서 페이지 오류는 없었다.

브라우저 검사 결과는 `/workspace/artifacts/visual-balance-browser.json`, `visual-boss-preview-browser.json`, `visual-details-browser.json`, `visual-shop-and-drag.json`에 저장했다.
