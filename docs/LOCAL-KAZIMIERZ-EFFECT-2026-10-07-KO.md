# 6카시미어 전용 효과

- 원본 자료: ArknightsAssets/ArknightsAssets2의 공식 클라이언트 번들 `battle/prefabs/effects/common.ab`.
- 확인한 프리팹: `common_071_bond_kazimierz_hit_01_new`, `common_071_bond_kazimierz_hit_01_start`, `common_071_bond_kazimierz_buff_01`.
- hit 프리팹의 `luojian_N_1`(낙검), 검 궤적, 섬광, 금색 입자와 바닥 효과 구성을 확인. 입자 색에는 RGB (1, .946, .507), (1, .899, .557)가 사용된다.
- 웹에서는 이를 참고해 금색 낙검, 밝은 타격 섬광, 확산 충격파와 짧은 금빛 입자로 재구성. Unity 프리팹을 그대로 재생한 것이 아니며 원본 영상과 프레임 단위 일치는 검증하지 않았다.
- 기존 `src=bond:kazimierzShip`, `key=pulse` 이벤트만 전용 처리. 기존 주기, 범위, 트루 피해 및 기절 판정 유지. 화면 배속을 반영하며 효과는 종료 후 정리된다.
- 테스트 스크린샷: `/workspace/artifacts/kazimierz-six-shockwave.png`. 실제 렌더러에 이벤트를 주입한 시험 장면이며 실전 전투 캡처는 아니다.
- 로컬에만 반영. 커밋·푸시·운영 배포 없음.
