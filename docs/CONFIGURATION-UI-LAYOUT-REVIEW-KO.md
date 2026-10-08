# 구성 화면 UI 비교와 선정

로컬 적용. 커밋·푸시·운영 배포는 하지 않았다.

선호 프리셋과 커스텀 확장 설정을 기존 오퍼레이터 구성 화면의 목록·편집 영역 구조에 맞췄다. 색상, 버튼, 선택 강조, 테두리는 기존 UI를 사용한다. 프리셋 저장, 검색·필터, 콘텐츠 제외 규칙과 최소 구성 검증을 유지했다.

## 비교

두 화면에 왼쪽 목록형, 상단 목록형, 좁은 목록형을 실제로 렌더링했다. PC 1440×1000, 모바일 390×844에서 총 12장으로 비교했다. 다음 수치는 최종 스타일에서 완전히 보이는 카드 수이며, 스크롤로 나머지 항목을 볼 수 있다.

| PC 구성 | 선호 카드 | 확장 카드 | 평가 |
| --- | ---: | ---: | --- |
| 왼쪽 목록형 | 40 | 24 | 기존 오퍼레이터 구성과 동일한 탐색 방식. 분류·프리셋 이름을 읽기 쉽다. |
| 상단 목록형 | 36 | 25 | 확장 카드가 1개 더 보이지만 목록 줄바꿈으로 본문 높이가 459px에서 390px로 줄어든다. |
| 좁은 목록형 | 48 | 24 | 선호 카드는 더 많이 보이지만 초상화가 작아지고 분류명 줄바꿈이 늘어난다. |

**왼쪽 목록형을 선정했다.** 카드 수만 최대화하는 것보다 기존 화면과의 일관성, 초상화 식별, 목록 이름 가독성을 우선했다. 첫 비교 이후 제목 크기·이름 말줄임·탭 정렬을 보완했으며 표는 보완 후 최종 수치다.

모바일에서는 왼쪽 목록을 가로 스크롤 목록으로 전환한다. 선호 카드는 16개, 확장 카드는 7개가 완전히 보인다. 탐색 버튼은 최소 44px 높이이며, 본문만 스크롤되어 적용·닫기 버튼이 화면 밖으로 밀리지 않는다. 확장 설정은 추가 확장과 기본 콘텐츠 금지를 분리하고, 검색과 선택 개수를 같은 행에 배치했다. 최소 구성과 검증 메시지는 하단에 고정했다.

## 비교 스크린샷

| 구성 | 선호 PC | 확장 PC |
| --- | --- | --- |
| 선정: 왼쪽 목록 | [보기](/workspace/artifacts/favorites-layout-side-desktop.png) | [보기](/workspace/artifacts/extensions-layout-side-desktop.png) |
| 상단 목록 | [보기](/workspace/artifacts/favorites-layout-top-desktop.png) | [보기](/workspace/artifacts/extensions-layout-top-desktop.png) |
| 좁은 목록 | [보기](/workspace/artifacts/favorites-layout-compact-desktop.png) | [보기](/workspace/artifacts/extensions-layout-compact-desktop.png) |

[선호 모바일](/workspace/artifacts/favorites-layout-side-mobile.png) · [확장 모바일](/workspace/artifacts/extensions-layout-side-mobile.png) · [상단형 선호 모바일](/workspace/artifacts/favorites-layout-top-mobile.png) · [상단형 확장 모바일](/workspace/artifacts/extensions-layout-top-mobile.png) · [좁은형 선호 모바일](/workspace/artifacts/favorites-layout-compact-mobile.png) · [좁은형 확장 모바일](/workspace/artifacts/extensions-layout-compact-mobile.png)

## 검증

12개 비교 화면 모두 본문 가로 넘침 없음, 하단 버튼 화면 내 표시, 브라우저 오류 없음. 관련 회귀 검사 16개 통과. 비교 측정값은 [JSON](/workspace/artifacts/editor-layout-comparison.json)에 저장했다. 비교용 data-layout 스타일은 사용자 설정으로 노출하지 않으며 기본 화면은 선정한 왼쪽 목록형이다.
