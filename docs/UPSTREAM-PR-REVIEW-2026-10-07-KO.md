# 원본 열린 PR 검토 — 2026-10-07

원본 sganggs/Stronghold-Protocol의 열린 PR 25개를 확인했습니다. 로컬 변경만 적용하며 커밋·푸시·배포하지 않았습니다. 충돌 없이 패치가 적용된다는 사실만으로 안전하다고 판단하지 않았습니다.

| PR | 결정 | 판단 및 통합 방법 | 검토한 head SHA |
|---|---|---|---|
| [#237](https://github.com/sganggs/Stronghold-Protocol/pull/237) | 반영 | 기존 myId 인수를 유지하고 alive를 네 번째 인수로 추가. | `335747aacf5feca9909c1b4ed71707e914a2bc63` |
| [#230](https://github.com/sganggs/Stronghold-Protocol/pull/230) | 제외 | 수동 git 업데이트 운영 방식과 충돌. | `7450ca506da79984f3fb75bb784ce88506c61b52` |
| [#229](https://github.com/sganggs/Stronghold-Protocol/pull/229) | 보류 | 장치 안내 입력 처리는 기존 터치·정보창 닫기 동작과 통합 검증 필요. | `77159d85a8d03a7a4f1267c1dcecab143c462b82` |
| [#227](https://github.com/sganggs/Stronghold-Protocol/pull/227) | 중복 제외 | 기존 sameFieldmates와 보스 짝 설정의 안내 기능 유지. | `8db69dd6db67befe291aa609991654bbcfa01003` |
| [#226](https://github.com/sganggs/Stronghold-Protocol/pull/226) | 반영 | 특별 새로고침 우선 출현만 지급. 잘못된 무료 횟수 지급 제거. | `a781b27e86f1272a595c99f7e78df2e8c8a49f4e` |
| [#225](https://github.com/sganggs/Stronghold-Protocol/pull/225) | 반영 | 직접 배치한 늑대만 사용. 협동 위치 유지. | `c87e05bff688dee026cc72fd9dea48cda1ca829b` |
| [#224](https://github.com/sganggs/Stronghold-Protocol/pull/224) | 중복 제외 | 이미 반영한 #196의 개체별 카운터·획득 시점 처리를 유지. 새 UID 카운터로 교체하지 않음. | `711e3c0bd9b1b36adc01c3035c40746b15a32148` |
| [#223](https://github.com/sganggs/Stronghold-Protocol/pull/223) | 제외 | 로컬 배치 순서·0.2초 간격·음성·애니메이션 수명주기와 겹침. 통째 적용 위험. | `91f77c7111f1e533ca33efefa95a4f0073296349` |
| [#222](https://github.com/sganggs/Stronghold-Protocol/pull/222) | 보류 | 경로 표시 추가는 렌더링 비용 및 기존 범위 표시와 교차 검증 필요. | `5b8e4f957016bc4e80d98cb13c51257b507f733c` |
| [#221](https://github.com/sganggs/Stronghold-Protocol/pull/221) | 반영 | 사망 시 스킬 종료 후 남기는 복귀 지점을 재배치 경로에 연결. | `ce6012589dba29644f359c73549ebab9262ccc11` |
| [#220](https://github.com/sganggs/Stronghold-Protocol/pull/220) | 반영 | 특별 우선순위 먼저 적용. 일반 저지 우선순위 유지. | `80d0eccd4c2d539ca6ec9aa5e07fcff0605b909e` |
| [#213](https://github.com/sganggs/Stronghold-Protocol/pull/213) | 제외 | 현재 카메라·배치 좌표·관전 조정과 겹치는 광범위 변경. | `3383dacfe39d8c5dc7fd7b95b3086fc0d27be210` |
| [#198](https://github.com/sganggs/Stronghold-Protocol/pull/198) | 제외 | 성능 개발 도구 추가는 이번 플레이 수정 범위 밖. | `48c470d04dee735e4de862f68a7a1300f56bae34` |
| [#196](https://github.com/sganggs/Stronghold-Protocol/pull/196) | 기반영 | 현재 코드에 동일 수정 존재. 특질 회귀 테스트 확인. | `d07649734e66dd7d5c2328b9233176283a54d6aa` |
| [#191](https://github.com/sganggs/Stronghold-Protocol/pull/191) | 중복 제외 | 현재 동료 안내 구현 유지. | `a00f3643e32fc43000c61e26fb996704de87ba18` |
| [#189](https://github.com/sganggs/Stronghold-Protocol/pull/189) | 중복 제외 | 현재 관전 대상 유지 구현 유지. | `c356fd325f89fb313689206aa4b850e7873bdf6b` |
| [#188](https://github.com/sganggs/Stronghold-Protocol/pull/188) | 제외 | 서버 바인딩 변경은 이번 로컬 게임 수정 범위 밖. | `0ce088b592801fbc0f302b88dcaf9f2f252e19d8` |
| [#158](https://github.com/sganggs/Stronghold-Protocol/pull/158) | 제외 | 컨테이너 배포 자동화는 현재 수동 EC2 운영 범위 밖. | `b6a320805148156c4cd85200d318e91b2aa14d5b` |
| [#157](https://github.com/sganggs/Stronghold-Protocol/pull/157) | 보류 | 적 계열 수 계산과 전투 프로토콜 등 다수 파일 변경. 이번 검증 범위를 넘어 별도 회귀 검증 필요. | `13a89fe7933dced23cafb940b329ee8f40ab76f7` |
| [#120](https://github.com/sganggs/Stronghold-Protocol/pull/120) | 중복 제외 | 기존 관전자 관리 구현 유지. | `79e7722c8eb14aa7def561cf515ba57490d9ff26` |
| [#112](https://github.com/sganggs/Stronghold-Protocol/pull/112) | 보류 | 결과 UI와 음성 처리에 광범위 변경. 로컬 결과 UI·승리 음성 제외 요구와 통합 검토 필요. | `b637e3b410934dd85909f7ce37e90affc6c6f317` |
| [#91](https://github.com/sganggs/Stronghold-Protocol/pull/91) | 보류 | 외부 방 조회 API 추가는 접근 범위·운영 API 중복 검토 필요. | `0c0347ec2a8ceb56dcf16f8b184da8fe2a7c19e5` |
| [#78](https://github.com/sganggs/Stronghold-Protocol/pull/78) | 제외 | 접속 안내 변경은 현재 브라우저 자동 접속 흐름과 상이. | `b8e2c5d73156dec87031939f5b9fbc030873ccc6` |
| [#70](https://github.com/sganggs/Stronghold-Protocol/pull/70) | 제외 | 한국어 번역 및 로컬 UI와 겹치는 광범위 영문 번역. | `99af5f99a6e88a4e3ddd92ca64ee68403ef9057d` |
| [#69](https://github.com/sganggs/Stronghold-Protocol/pull/69) | 제외 | 개발 테스트 페이지 묶음은 이번 플레이 수정 범위 밖. | `7ce413cc161afc7ca2788f85bc16022ffeec0a5a` |

## 검증

반영한 PR의 전략·소환·강제 복귀·공격 우선순위·관전 안내 테스트 196개가 통과했습니다. 우르수스·기존 특질 회귀 테스트 85개와 버전·패치노트 테스트 5개도 통과하여 총 286개를 확인했습니다. #237은 원본 세 번째 인수 변경을 그대로 적용하지 않고 기존 동료 식별 인수를 보존했습니다. #221은 사망 시 skill.end 처리 이후 본체 위치를 결정하는 현재 수명주기와 연결됩니다.
