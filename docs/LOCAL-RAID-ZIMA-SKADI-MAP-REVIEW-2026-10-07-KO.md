# 기습·우르수스·스카디 및 맵 배치물 점검 (로컬)

## 전투 변경

- 기습: 기존 구현 유지. 기습 재배치 성공 시 공격력·최대 HP ×(1.25 + 0.01×중첩), 퇴각 시 제거. 회귀 테스트로 확인.
- 아군 제국 드론: 기지까지 남은 이동 거리가 짧은 적부터 접근·공격. 같은 거리에서는 기존 보스/저지 우선순위를 유지. 조준 도중 교체·이동 중 공격·공격속도 면역은 유지. 적 제국 드론은 변경하지 않음.
- 지마 3스킬: 발동 후 적이 없어도 앞쪽 고정 타일에 공격하며 5발을 정상 간격·선딜레이로 소모. 고지대 연쇄 효과 유지.
- 스카디: 선택된 스킬 ID로 3스킬 효과 판정. 해사 수명 종료와 처치 모두 기존 토큰의 재배치 경로 사용. S1 피해 이전·치유와 S2 공격력/방어력 고무 테스트 통과.

## 원본 맵 대조

원본: Kengxxiao/ArknightsGameData의 zh_CN/gamedata/levels/activities/*/level_*.json. 비교 원문은 /workspace/artifacts/map-device-audit 에 보관.

모든 사전 배치물의 종류·별칭·좌표·방향·초기 활성 상태를 비교했으며 11개 맵에서 차이가 없었음. 숨겨진 장애물을 무조건 켜지 않음. 예컨대 act1 m02는 원본에서도 초기 상자/사격대가 숨겨져 있음.

| 맵 | 전체 배치물 | 초기 활성 | 눈에 보이는 초기 배치물 |
|---|---:|---:|---|
| act1autochess_m01 | 17 | 13 | crate 12 |
| act1autochess_m02 | 37 | 1 | 없음 |
| act1autochess_m03 | 29 | 25 | platform 16, crate 8 |
| act1autochess_m04 | 17 | 13 | crate 12 |
| act1autochess_m05 | 70 | 66 | waterPlatform 64 |
| act1autochess_m06 | 43 | 38 | mound 28, platform 4, sealedFloor 4 |
| act1autochess_m07 | 17 | 13 | bush 8, crate 4 |
| act2autochess_m01 | 13 | 9 | blower 8 |
| act2autochess_m02 | 10 | 6 | crate 4 |
| act2autochess_m03 | 15 | 11 | crate 10 |
| act2autochess_m04 | 10 | 6 | crate 4 |

확인한 렌더링 누락: 사격대·수상 발판·봉인 바닥은 절차적 board/decal 버킷에 포함되지만 원본 3D 맵 사용 시 해당 버킷을 그리지 않음. 별도 장치 버킷으로 렌더링하도록 보완. 특히 act1 m03/m05/m06에 영향. 휴식 기간에는 정적 장치를 표시하며, 전투에서는 시뮬레이션 상자와 중복되지 않도록 기존 처리를 유지.

외형 차이로 남은 항목: act1 m06의 mound는 현재 상자 모델을 변형한 대체물, act1 m07의 bush는 단순 도형 대체물. 발판도 원본 장치 전용 모델이 아닌 기존 텍스처/지오메트리 표현. 원본 배치 데이터의 누락과 구분해야 함. 맵 자체의 Unity 정적 장식은 이번 좌표 대조만으로 완전 일치를 보증하지 않음.

## 검증

- 관련 전투·맵 테스트 182개 통과, 스카디 집중 테스트 4개 및 지마 빈 범위 발사 테스트 1개 통과.
- 스킬 범위 발동·과열 게이지·클라이언트 정적 검사 18개 통과.
- 추가로 넓게 실행한 tier6 테스트에서 기존 chess_char_6_08_a 즉시 발동 검사 1개 실패. 이번 변경과 별개이며 전체 테스트가 모두 통과했다고 보고하지 않음.
- 커밋/푸시 및 운영 배포 없음.

## 휴식 화면 스크린샷

원본 3D 장면 로딩을 확인한 후 촬영했습니다. 오퍼레이터 리소스는 백그라운드 다운로드 중일 수 있어 일부 초상화 대체 표시가 포함됩니다.

- [사격대 맵](../../artifacts/map-devices-act1autochess_m03-prep.png)
- [수상 발판 맵](../../artifacts/map-devices-act1autochess_m05-prep.png)
- [봉인 바닥·토석 맵](../../artifacts/map-devices-act1autochess_m06-prep.png)
