# 세부 직군 특성 점검 (로컬, 2026-10-06)

## 명사수: 재현 결과

일반/정예 명사수의 선택 가능한 스킬과 모듈 조합을 검사했다. 저지되지 않은 지상 적과 공중 적이 함께 공격 범위에 있으면 공중 적을 먼저 선택한다. 비행 판정은 현재 상태를 사용한다.

다음은 의도된 예외이며 이번에 변경하지 않았다.

- 자신이 저지 중인 적은 우선 선택한다.
- 은현 2스킬은 스킬 설명에 따라 원거리 무기를 사용하는 적을 우선한다.
- 이미 시작한 공격은 살아 있는 기존 대상을 유지한다. 이후 새로운 공격을 시작할 때 공중 우선순위를 다시 적용한다. 기존 요청인 공격 도중 대상 이탈 시 애니메이션 유지와 양립하도록 보존했다.

따라서 제공된 제보만으로 명사수의 일반 우선순위가 누락됐다고 확인되지는 않았다. 위 예외를 포함한 재현 테스트를 추가했다.

## 확인하여 수정한 누락

### 무사 / 수확자

공격 이벤트 한 번으로 회복량을 계산해 무사의 다중 타격이 한 번만 회복하고, 회피된 공격도 회복할 수 있었다. 실제 피해 처리 이벤트마다 회복하게 변경했다. 직접 스킬 타격도 적용하며, 수확자의 동시 회복 횟수는 저지 수로 제한한다. 일반 지속 피해는 제외하되 기본 공격 판정의 지속 피해는 기존 요청대로 보존한다.

### 음유시인

일부 오퍼레이터 구현에서만 격려 면역을 설정하여 다른 음유시인과 직접 버프를 추가하는 경로가 면역을 우회할 수 있었다. 직군 공통 설정과 버프 입구에서 공격력·방어력·HP 격려를 차단한다. 일반 아군의 격려 획득은 유지한다.

## 점검 범위와 한계

현재 기본 데이터에 등장하는 세부 직군 57종의 설명, 프로필과 개별 구현을 대조했다. 우르수스 및 선발을 포함한 관련 오퍼레이터 구현 회귀 검사도 실행했다. 데이터에만 적힌 문장을 전부 실제 플레이로 증명한 것은 아니며, 이번 변경으로 모든 특성의 완전한 원작 일치를 보증하지 않는다.

공통 처리에서 확인한 주요 항목은 연쇄 공격·연쇄 치료, 저격 우선순위, 지상 전용 포격, 공격 시 회복, 원소 치료, 탄약·재장전, 신비술 저장, 부메랑 회수, 해방자·진법술사 공격 제한, 상인 비용 소모, 인형사 전환, 전술가 소환물 등이다. 기본 공통 프로필이 비어 있는 항목도 스탯·스킬·개별 오퍼레이터 처리로 구현할 수 있으므로 빈 프로필만으로 누락이라고 판단하지 않았다.

메카 캐스터는 현재 드론 연속 공격 배율을 단일 공격 경로로 표현한다. 본체와 드론의 독립 타격을 원작처럼 분리했는지는 추가 정밀 검증이 필요하다. 잠금 대상·방출 드론 스킬까지 영향을 주는 일괄 배율 변경은 적용하지 않았다.

PRTS 직접 요청은 403으로 차단됐다. 이번 판정에는 저장된 공식 게임 데이터, 기존 원작 자료 주석과 실제 시뮬레이션을 사용했다. 실시간 위키 대조를 완료했다고 간주하지 않는다.

## 검증

- 새 대상 선택·다중 타격·격려 면역 회귀 검사: 5개 통과.
- 기본/대체/우르수스 오퍼레이터 구현, 직군과 대상 선택 관련 검사: 476개 통과.
- 고정 시나리오 133개를 다시 계산하고, 빠른 골든 회귀 검사도 통과했다. 회복 이벤트 증가 등 이번 수정에 따른 결과 변경을 확인했다.
- 로컬에만 반영. 커밋·푸시·운영 배포 없음.

테스트: `test/sim/subprofession-traits-review.test.js`

## 데이터별 목록

아래 항목 수는 일반/정예 등 데이터 레코드 수이며 고유 오퍼레이터 수가 아니다. 공통 처리에 개별 스킬·모듈 구현이 추가된다.

| 세부 직군 ID | 데이터 항목 수 | 공통 처리 |
|---|---:|---|
| `agent` | 2 | canHitFly |
| `alchemist` | 6 | attack, canHitFly, projectile |
| `artsfghter` | 4 | dmgType |
| `bard` | 6 | noAttack, dmgType, heal, install |
| `blastcaster` | 4 | rangeAoe |
| `bombarder` | 2 | splashRadius, projectile, groundOnly, canHitFly, afterHit |
| `centurion` | 8 | hitAllBlocked |
| `chain` | 4 | chain |
| `chainhealer` | 2 | heal |
| `charger` | 6 | install |
| `closerange` | 2 | 개별 스탯·스킬·오퍼레이터 구현 |
| `counsellor` | 2 | 개별 스탯·스킬·오퍼레이터 구현 |
| `craftsman` | 2 | attack, dmgType, projectile, canHitFly |
| `crusher` | 2 | hitAllBlocked |
| `dollkeeper` | 4 | install |
| `executor` | 4 | 개별 스탯·스킬·오퍼레이터 구현 |
| `fastshot` | 10 | priority, dmgMul |
| `fearless` | 4 | 개별 스탯·스킬·오퍼레이터 구현 |
| `fighter` | 2 | 개별 스탯·스킬·오퍼레이터 구현 |
| `fortress` | 4 | fortress, splashRadius, projectile, canHitFly, groundOnly |
| `funnel` | 10 | projectile, install, dmgMul |
| `geek` | 2 | install |
| `guardian` | 6 | 개별 스탯·스킬·오퍼레이터 구현 |
| `hammer` | 2 | splashRadius, splashScale, splashOthersOnly |
| `healer` | 2 | heal |
| `hookmaster` | 4 | canHitFly |
| `hunter` | 2 | install, canAttack, dmgMul, afterAttack |
| `incantationmedic` | 6 | dmgType, projectile, heal, install |
| `instructor` | 2 | dmgMul |
| `librator` | 2 | noAttackUnlessSkill, install |
| `longrange` | 4 | priority |
| `loopshooter` | 2 | projectile, boomerang, install, canAttack |
| `lord` | 8 | canHitFly, dmgMul |
| `merchant` | 2 | install |
| `musha` | 2 | noHeal, install |
| `mystic` | 2 | install, hitsFn |
| `phalanx` | 8 | noAttackUnlessSkill, rangeAoe, install |
| `physician` | 10 | heal |
| `pioneer` | 6 | 개별 스탯·스킬·오퍼레이터 구현 |
| `primcaster` | 6 | 개별 스탯·스킬·오퍼레이터 구현 |
| `primprotector` | 4 | 개별 스탯·스킬·오퍼레이터 구현 |
| `protector` | 8 | 개별 스탯·스킬·오퍼레이터 구현 |
| `pusher` | 2 | hitAllBlocked |
| `reaper` | 6 | noHeal, allInRange, install |
| `reaperrange` | 4 | allInRange, dmgMul |
| `ringhealer` | 8 | heal |
| `ritualist` | 4 | 개별 스탯·스킬·오퍼레이터 구현 |
| `shotprotector` | 6 | attack, canHitFly, projectile |
| `skywalker` | 2 | canHitFly, blockFly, install |
| `slower` | 12 | onHitStatus |
| `splashcaster` | 10 | splashRadius |
| `stalker` | 2 | allInRange, install |
| `sword` | 2 | hits |
| `tactician` | 4 | install, dmgMul |
| `underminer` | 8 | 개별 스탯·스킬·오퍼레이터 구현 |
| `unyield` | 4 | noHeal |
| `wandermedic` | 4 | heal |
