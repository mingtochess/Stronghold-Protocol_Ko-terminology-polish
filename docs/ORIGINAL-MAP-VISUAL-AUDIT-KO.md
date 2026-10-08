# 원본 맵 재질·환경 비교 및 수정

2026-10-09 (한국 시간). 로컬 변경이며 커밋/푸시하지 않음.

## 비교 기준

원본은 ArknightsAssets/ArknightsAssets2의 명일방주 리소스이며 Stronghold 웹 구현을 원본으로 취급하지 않았다. 원본 장면의 메시, UV, 텍스처, 재질 속성, 셰이더 활성화 키워드, 라이트맵과 광원 방향을 확인했다. PRTS의 실제 맵 사진과 별도로 대조했다.

원본 번들 재추출 결과가 일치한다는 검사는 **추출의 재현성**만 확인한다. 원본 게임의 렌더링과 같다는 증거로 사용하지 않는다. 타일/장애물 좌표 비교도 논리 배치만 확인하며 외관 일치를 뜻하지 않는다.

## 발견한 차이와 수정

| 발견한 차이 | 원인 | 수정 |
|---|---|---|
| 사막 앞줄 타일의 무늬와 대비가 원본보다 강함 | 원본의 정점 빨간 채널을 이용한 모래색 혼합을 누락 | 실제 셰이더의 smoothstep 혼합·법선 평탄화·거칠기 계산 적용 |
| 도시 맵 바닥 일부가 흰색으로 변함 | 비활성 셰이더 기능까지 적용 | `_HG_VERTEX_COLOR_BLEND_ON`이 활성화된 재질에만 색 혼합 적용 |
| 조명/반사광이 원본과 다름 | 웹 GGX, 임의 바닥 광택, 고정 광원 방향, 잘못된 금속성 변환 | 원본 감마 확산광 계수/F0/직접 반사광 근사식 적용, 임의 광택 제거, 원본 광원 방향·재질별 그림자 강도·재질 키워드·금속성/거칠기 채널 반영 |
| 주변 물이 빠져 빈 공간이 생김 | 재질 이름에 water가 있으면 메시 전체를 추출에서 제외 | 원본 주변 수면 메시 포함, 원본 물 색과 법선/카우스틱 텍스처로 유사한 수면 구현 |
| 장식이 잘리거나 전장 밖 다른 바닥이 남음 | 전장 바닥과 장식 메시의 영역 처리 혼용 | 전장 바닥은 활성 영역으로 제한하고 연결된 장식은 통째로 보존 |
| 보스 준비 화면 위에 다른 전장 표시 | 일반 전장과 보스 전장 영역의 합집합 사용 | 보스 영역만 표시, 협력방어에서도 비활성 전장 플랫폼 제외 |
| 늪지·분노/원석·침수 표현이 원본 타일 위에 겹침 | 절차적 환경 표면을 원본 맵에도 추가 | 원본 장면 로드 성공 시 추가 표면 제거. 단순 맵 대체 표시에서는 유지 |
| 사격 발판이 단순 판으로 보임 | 일반 타일 아틀라스로 대체 | 원본 `trap_1106_achplat` 메시·UV·재질 적용 |
| 침수 유닛이 수면 위에 그대로 서 있음 | 유닛 침수 표시 없음 | 지상 유닛 모델을 0.18타일 낮추고 청록색으로 어둡게 표현. 이탈 시 복원. 공중/수면 위 발판 제외. 공격점도 같은 실제 높이 사용 |

빈 공간은 새 배치 타일로 채우지 않고 원본의 주변 물·암반·장식 메시를 보존해 채운다. 장식 메시 추가는 배치 가능 여부나 클릭 영역을 바꾸지 않는다.

[침수 맵 원본·수정 전·후 비교](/workspace/artifacts/map-audit/desert-water-comparison.png) · [11개 맵 최종 모음](/workspace/artifacts/map-audit/map-overview-final.png)

## 맵별 비교 이미지

최종 사진은 배치물까지 보이도록 준비 상태의 고정 장애물을 표시했다. 수정 전 사진은 전투 빈 장면으로 촬영되어 고정 장애물이 빠져 있다. 따라서 **상자 개수의 전후 차이는 이번에 새로 고친 사항으로 해석하면 안 된다.** 이미지의 카메라와 UI는 원본 사진과 동일하지 않다.

### act1autochess_m01

사막: 타일 모래색 혼합·주변 물·광원 계산

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m01-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m01-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m01-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m01-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m01-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m01-bossPrep-final.png)

### act1autochess_m02

사막: 타일 모래색 혼합·주변 물·광원 계산

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m02-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m02-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m02-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m02-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m02-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m02-bossPrep-final.png)

### act1autochess_m03

사막: 원본 사격 발판 메시/재질·타일 혼합

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m03-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m03-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m03-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m03-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m03-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m03-bossPrep-final.png)

### act1autochess_m04

사막: 타일 혼합·주변 물·장식 보존

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m04-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m04-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m04-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m04-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m04-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m04-bossPrep-final.png)

### act1autochess_m05

사막 침수: 추가 물 덮개 제거·원본 수면 유지

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m05-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m05-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m05-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m05-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m05-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m05-bossPrep-final.png)

### act1autochess_m06

사막 원석 지형: 추가 환경 덮개 제거·타일 혼합

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m06-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m06-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m06-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m06-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m06-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m06-bossPrep-final.png)

### act1autochess_m07

사막 늪지: 추가 늪지 덮개 제거·타일 혼합

- 일반: [수정 전](/workspace/artifacts/map-audit/act1autochess_m07-normal-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m07-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act1autochess_m07-unite-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m07-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act1autochess_m07-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act1autochess_m07-bossPrep-final.png)

### act2autochess_m01

도시: 비활성 흰색 혼합 제거·발광/금속성 활성화 설정

- 일반: [수정 전](/workspace/artifacts/map-audit/act2autochess_m01-normal-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m01-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act2autochess_m01-unite-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m01-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act2autochess_m01-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m01-bossPrep-final.png)

### act2autochess_m02

사막 늪지: 추가 늪지 덮개 제거·주변 물

- 일반: [수정 전](/workspace/artifacts/map-audit/act2autochess_m02-normal-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m02-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act2autochess_m02-unite-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m02-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act2autochess_m02-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m02-bossPrep-final.png)

### act2autochess_m03

공장: 원본 광원 방향·금속성/거칠기·반사광 계산

- 일반: [수정 전](/workspace/artifacts/map-audit/act2autochess_m03-normal-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m03-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act2autochess_m03-unite-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m03-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act2autochess_m03-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m03-bossPrep-final.png)

### act2autochess_m04

사막 침수: 앞줄 타일 모래색 혼합·외부 물 복원·침수 높이

- 일반: [수정 전](/workspace/artifacts/map-audit/act2autochess_m04-normal-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m04-normal-final.png)
- 협력방어: [수정 전](/workspace/artifacts/map-audit/act2autochess_m04-unite-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m04-unite-final.png)
- 보스 준비: [수정 전](/workspace/artifacts/map-audit/act2autochess_m04-bossPrep-before.png) · [최종](/workspace/artifacts/map-audit/act2autochess_m04-bossPrep-final.png)

## 원본 실게임 사진과 남은 차이

[PRTS 원본 사진 모음](/workspace/artifacts/prts-map-reference-overview.png), [제보된 침수 맵 원본](/workspace/artifacts/prts-map-reference-07.png).

전체 11개 맵의 리소스·논리 배치와 3가지 시점은 확인했다. 확보한 PRTS 사진은 기본 맵 8종이며, 추가 파생 맵과 모든 전투 단계의 실제 원본 사진까지 확보한 것은 아니다. 모든 맵의 외관이 원본과 완전히 동일하다고 결론내리지 않는다.

물은 색·움직임이 비슷한 웹 구현이며 원본의 깊이 기반 거품/반사를 그대로 이식하지 않았다. 조명은 원본 직접광 계산을 옮겼지만 Unity의 반사 프로브·후처리 전체는 이식하지 않았으며 하늘광 기여는 웹 근사다. 흙더미·덤불·일부 특수 설치물의 런타임 표현도 기존 대체 구현이 남아 있다. 이를 원본과 동일한 설치물 모델이라고 표시하지 않는다.

## 검증

- 렌더링 테스트: 518개 중 515개 통과, 3개 기존 브라우저 조건부 테스트 생략.
- 추가 회귀 검증: 원본/단순 맵 환경 덮개 분기, 침수 진입·이탈 높이, 공중/발판 제외, 재질 활성화 키워드, 전장 외부 플랫폼 제외, 원본 사격 발판 재질.
- 11개 맵 × 일반/협력방어/보스 준비, 총 33개 최종 캡처: 페이지/셰이더 오류 0개.
- 런타임 리소스 77개 재추출 비교: 차이 0개. 시각적 동일성 검사가 아님.
- 원본 레벨 비교: 타일 4,389개와 사전 배치물 278개 논리 배치 일치.
- [침수 전](/workspace/artifacts/map-audit/unit-dry.png) · [침수 중](/workspace/artifacts/map-audit/unit-submerged.png) · [이탈 후](/workspace/artifacts/map-audit/unit-recovered.png).

## 밝기·명암 대비 재조정

앞선 조명 이식에서 확산광 계수와 광원 방향을 함께 변경하며 밝은 면의 직접광까지 줄어들었다. 원본 장면의 직접광 강도에 웹 렌더링 보정 1.8배를 적용했다. 환경광·라이트맵·그림자 강도·텍스처 색은 그대로 유지한다. 그림자 바닥을 통째로 밝히는 대신 빛을 받는 면이 밝아져 명암 대비가 유지된다.

[사막·도시·공장 동일 시점의 수정 전후 비교](/workspace/artifacts/map-audit/brightness-contrast-comparison.png).

재조정 검증: 렌더링 단위 테스트 33개 통과, 3개 맵 실제 브라우저 촬영에서 페이지/셰이더 오류 0개. 위의 33개 전체 맵 캡처는 재조정 전 상태이며, 이 항목의 사진이 최신 밝기다.

### 도시 광원·주변 장식 및 침수 수면 추가 수정 (2026-10-09)

- 도시만 광원의 수평 방향을 유지하고 높이 방향을 `0.16749 → 1.05`로 조정했다. PRTS 도시 사진의 밝은 바닥과 짧은 벽 그림자를 기준으로 삼았다. 다른 맵의 직접광 세기·색·방향은 변경하지 않았다. 원본 후처리 전체를 재현한 것은 아니다.
- 도시의 미리보기 구역 왼쪽(`열 0–5, 행 14–18`)에 있는 원본 장식 메시가 비활성 전장 필터로 사라지고 있었다. 일반/연합방어 화면에서 장식만 유지한다. 배치 타일 및 보스 화면은 기존 영역 필터를 유지한다.
- 전체 맵의 부분 그림자 가시성을 `visibility^1.35`로 조정했다. 완전히 빛을 받는 면의 값 `1`은 유지하며, 배경 그림자 불투명도를 `0.50 → 0.60`으로 높였다.
- 침수 맵의 `MT_Dosshore_UI` 평면(`z=-0.02`)이 원본 수면(`z=-0.141`)을 덮던 중복 렌더링을 제거했다. 원본 수면이 실제로 존재할 때만 제거하며, 단순 맵과 원본 수면이 없는 맵은 유지한다. 침수 수면 색은 원본 사진에 가까운 동일 테마의 청록 물 재질을 사용한다. 수면과 가장자리의 원본 좌표는 변경하지 않았다.
- 환풍구 바람 중심선 최대 불투명도 `0.32 → 0.74`, 길이 `0.28 → 0.36` 타일로 조정하고 어두운 가장자리를 추가했다. 은신 안개 폭·높이와 이동 폭은 약 12% 축소했다.
- 전장 선발 라벨을 제거했다. 상점 선호/선발 표시는 초상화 왼쪽, 등급·가격 아래로 이동했다. 하늘색/민트 테두리에 외부·내부 발광을 적용했다.
- 인게임 채팅 컴포넌트를 설정·도감 등이 있는 `gm__corner` 그룹 안으로 이동했다. 독립 고정 좌표와 버튼 폭만큼의 강제 보정 대신 같은 flex 행을 사용한다. 대기실 채팅 배치는 유지한다.

확인 자료:

- [도시 원본·수정 전·후](/workspace/artifacts/map-audit/city-lighting-original-before-after.png)
- [침수 수면 수정 전·후](/workspace/artifacts/map-audit/water-height-before-after.png)
- [상점 표시·발광](/workspace/artifacts/shop-preference-glow-after.png)
- [채팅 그룹 데스크톱](/workspace/artifacts/chat-button-group-1600.png)
- [채팅 그룹 모바일](/workspace/artifacts/chat-button-group-390.png)

렌더링·선호 목록 테스트 525개 중 522개 통과, 기존 조건부 테스트 3개 제외. 도시 광원 전환, 주변 장식/타일 필터 분리, 침수 중복 평면 제거 및 전장 선발 표시 제거를 확인했다. 상점 브라우저에서 두 표시가 헤더 아래 왼쪽에 있으며 테두리 발광이 적용되는 것을 확인했다.


### 보스 오른쪽 진영 카메라·채팅 그룹 후속 검증

- 오른쪽 보스 준비 카메라가 왼쪽의 대칭 위치보다 상점 표시 시 1타일, 접힌 상태에서 1.26타일 더 오른쪽에 있었다. 왼쪽 카메라의 거리·높이·화각을 유지하며 전장 중심을 기준으로 실제 좌표를 대칭 배치한다. 원본 맵별 설정이 있으면 그 왼쪽 값을 기준으로 한다.
- 보스 준비 및 해당 준비 프리셋을 사용하는 관전 화면에 적용한다. 이미 대칭인 전투 반쪽 보기의 카메라 값은 유지한다. 데스크톱·가로 모바일·세로 모바일과 상점 펼침/접힘을 검사했다.
- [왼쪽 기준·오른쪽 수정 전/후 비교](/workspace/artifacts/map-audit/boss-camera-left-right-comparison.png)
- 카메라 테스트 28개 통과. 캡처한 보스 화면의 브라우저 오류 0개.
- 채팅을 버튼 그룹 안으로 옮긴 뒤 이모티콘 선택창보다 앞에 겹치던 stacking context를 제거했다. 실제 소켓을 쓰는 채팅·이모티콘·한국어 조합·재접속, 알림 소리, 대기실 채팅/관전자 테스트 4개 모두 통과했다.


### 상점 강조 후속 조정

선호·선발 카드의 안쪽/바깥쪽 발광과 별표의 색상 발광을 제거했다. 윤곽선은 승급 가능 카드와 같은 1px 테두리 + 번짐 없는 1px 외곽선으로 맞췄다. 표시 위치와 하늘색/민트 구분은 유지한다.
