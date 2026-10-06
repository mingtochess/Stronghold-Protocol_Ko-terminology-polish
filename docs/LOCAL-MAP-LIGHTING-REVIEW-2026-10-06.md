# 원본 전장 텍스처·조명 대조 — 로컬 검토

운영 배포·커밋·푸시는 하지 않았다. 이전 변경 위에 로컬로 적용했다.

## 비교 근거

[PRTS 위수협약: 맹약 하반 전장 목록](https://prts.wiki/w/卫戍协议：盟约_下半/战场一览)의 실제 게임 스크린샷을 내려받아 확인했다. 원본 이미지 7장을 확보했고, 다운로드 실패한 전장 02 이미지는 근거에 포함하지 않았다.

- [원본 스크린샷 모음](/workspace/artifacts/prts-map-reference-overview.png)
- [원본 이미지별 URL](/workspace/artifacts/prts-map-reference-sources.json)
- [원본·수정 전·최종 수정 후 비교](/workspace/artifacts/map-lighting-comparison.png)
- [최종 맵 11종](/workspace/artifacts/map-lighting-final-overview.png)

사막 `act1autochess_m01`(전장 01), 도시 `act2autochess_m01`(전장 05), 공업 `act2autochess_m03`(전장 07)을 대표 비교 대상으로 삼았다. 위키 이미지와 테스트 화면은 카메라·화면비·UI가 다르므로 픽셀 차이를 전부 조명 차이로 단정하지 않았다.

## 어두운 원인과 최종 수정

광원 세기만 올린 초기 조정은 충분하지 않았다. 기지/출현 지점은 발광 재질이고, 장애물은 별도 재질이라 바닥과 다른 경로를 사용한다. 아래 누락을 수정하고 과도하게 올린 주광/보조광은 되돌렸다.

1. **원본의 베이크 조명이 누락됐다.** `lightingdata.ab`와 장면 `LightmapSettings`를 연결해 11개 장면의 RGBM 라이트맵 20장을 가져왔다. 메시를 재질과 라이트맵 인덱스로 나누어, 바닥·벽·암벽이 자신에게 맞는 조명 텍스처를 사용한다.
2. **조명용 UV2와 변환이 누락됐다.** Unity UV2를 Three `uv1`로 내보낸다. 정적 배칭 메시의 UV는 이미 아틀라스 좌표라 다시 scale/offset을 적용하지 않는다. 비배칭 메시에는 `m_LightmapTilingOffset`을 적용한다.
3. **UV2가 없는 바닥의 fallback을 잘못 적용했다.** 최초에는 `(0,0)+ST`로 내보냈으나 이것은 잘못된 처리였다. 실제 타일 렌더러 ST는 기본 UV(텍스처 아틀라스 좌표)에 맞춰져 있다. 최종 코드는 UV2가 없으면 UV0를 사용하고 비배칭 렌더러의 ST를 적용한다. 자세한 실측과 수정 전후 비교는 문서 마지막 절에 기록했다.
4. **감마 계산과 선형 PBR 계산이 달랐다.** 원본 `Torappu/Scene/StandardRealtimeShadow` GLES 코드를 확인했다. 감마 F0 값 `0.220916301`, RGBM `RGB × alpha × HDR scale` 경로를 사용하며, 해당 코드에는 선형 모드의 alpha 거듭제곱이나 최종 sRGB 인코딩이 없다. 원본 맵 재질에 감마용 색/조명 응답과 RGBM range 5 해석을 적용했다. 일반 웹 보드의 선형 렌더 경로는 유지한다. [원본 셰이더 확인 자료](/workspace/artifacts/native-map-shader-gamma-evidence.txt)
5. **맵별 원본 주광을 사용한다.** 장면 Light에서 읽은 강도와 색을 적용한다. 사막은 강도 1.1, 도시는 0.9, 공업은 1.0이다. 초기 실험의 주광 7.0/보조광 1.8은 최종 코드에서 사용하지 않는다.
6. **빠진 표면 데이터를 연결했다.** ETC2 RGB 노멀 XYZ를 그대로 사용하고, smoothness(alpha)를 roughness(G=1−alpha)로 변환한다. 노멀과 roughness는 linear data다. 재질별 `_BumpScale`, UV scale/offset을 유지한다.

[같은 광원에서 베이크 조명 유무를 비교한 캡처](/workspace/artifacts/map-gamma-lightmap-baked.png) · [베이크 조명 비활성 캡처](/workspace/artifacts/map-gamma-lightmap-without-baked.png)

## 텍스처·모델 수정

- 장애물에 기존 나무 상자 아틀라스의 추정 UV를 사용하던 경로를 교체했다. `arts/maps/common/trap/trap_110.ab`의 실제 `trap_1105_accrate` 메시·UV·전용 텍스처를 사용한다. 준비/전투 장치가 같은 소스를 사용한다.
- 원본 타일 UV와 좌표는 유지했다. 이미지 Y 방향 반전 실험은 아틀라스의 엉뚱한 영역이 붙는 것을 확인하고 적용하지 않았다.
- Texture 캐시 키에 색 계산 방식, scale, offset을 포함했다. 같은 이미지가 다른 재질의 변환/색 공간을 잘못 공유하지 않도록 한다. 현재 맵에서 동일 이미지/슬롯의 서로 다른 scale/offset 조합이 실제로 발견된 것은 아니며, 이 방어 수정만으로 모든 배치 문제를 설명하지 않는다.
- 음수 스케일이 있는 비배칭 메시의 면 방향을 함께 수정했다. 모든 메시의 winding을 일률적으로 뒤집던 처리를 변환 행렬의 부호에 맞췄다.
- `GameObject.m_IsActive=false`를 모두 제외하는 실험은 **적용하지 않았다.** 실행 중 켜는 전장 타일까지 사라지는 것을 캡처로 확인했다. 이 실험이 어둠의 원인을 확정했다고 했던 중간 판단은 철회했다.

## 캐시·재현

현재 경로 `*-v14.json.gz`, `materials-v9.json`, `*-rgbm-v1.png`, 노멀/roughness 파생 이미지, `crate-v1.json`, 장치 텍스처를 기존 리소스 캐시 목록에 등록했다. 기존 파일을 지우지 않고 변경된 경로/누락된 파일을 받는다.

준비 명령: `python3 tools/fetch-original-map-bundles.py` → `.cache/battle-extract-venv/bin/python tools/local-extract/extract-original-maps.py`. 기존 `node tools/setup-battle-assets.mjs`에도 연결돼 있다. 출처는 `ArknightsAssets/ArknightsAssets2`, 인덱스 커밋 `7ddea107cef9ab24d55052f36bf984fcd1bff9ed`, 버전 `26-04-14-11-12-01_cf554f`이며 선택한 원본 번들의 MD5를 검증한다.

## 검증과 한계

보드 아트·3D·생명주기 테스트 45개 통과, 실패/건너뛰기 없음. 색 계산, 원본 주광, RGBM 해석, 별도 조명 UV, 재질별 UV 변환 격리, 준비/전투 장치의 원본 UV, 맵 전환 시 조명 GPU 자원 해제를 검증한다. `git diff --check` 통과. 맵 11종 최종 브라우저 렌더에서 JS/콘솔 오류 0, 원본 장면이 모두 로드되는 것을 확인했다. 각 맵 스크린샷을 남겼다.

물·지형 블렌드·반사 큐브·전체 BRDF를 Unity 엔진과 1:1로 포트한 것은 아니다. 표면과 조명 해석을 복원한 근사 렌더이며 원본 스크린샷과 완전히 동일하다고 단정하지 않는다. 실제 휴대폰 GPU에서의 성능/색상 확인도 별도로 필요하다.

## 추가 수정: 타일별 어둠·외부 전장·선행 로딩

이번 요청에 따라 원본 장면 내 전장 바닥(`S_Ground`, `S_playground`), 패치/숨김 바닥과 배경 장식을 별도 버킷으로 내보냈다. 장면 파일은 `-v12.json.gz`로 변경하여 기존 캐시와 구별한다. 원본 UV·라이트맵 UV는 그대로 유지한다.

- **철회된 실험:** 원본 베이크 조명이 있는 정적 모델의 웹 실시간 그림자 생성/수신을 껐다. 사용자 지적 이후 이를 복구했다. 기존에는 원본 라이트맵의 어둠과 새 그림자가 중복되어 일부 바닥에 짙은 그림자가 추가됐다. 원본 자체의 조명/음영은 남는다. 별도 게임 장치의 그림자 경로는 유지한다.
- 전장 바닥 및 패치의 삼각형을 현재 표시 영역에 맞춰 제한한다. 일반 전장은 자신의 반쪽, 연합방어는 양쪽, 보스전은 보스 영역을 사용한다. 제외된 바닥은 그림자 패스에도 남지 않는다. 배경 지형은 바닥처럼 잘라내지 않는다. 카메라 전환 중에는 기존 영역 합집합 규칙을 따른다.
- 맵 팩을 준비할 때 모든 원본 장면 압축 파일을 미리 fetch하고 응답을 읽어 브라우저/기존 리소스 서비스워커 캐시에 준비한다. 선택된 첫 맵은 3D 전장을 켜기 전에 디코딩한다. 다음 맵은 압축 파일 캐시를 재사용한다. 디코딩된 데이터는 최근 두 맵만 유지한다. 이미 메모리에 있는 맵을 다시 요청하면 fetch/디코딩 없이 사용하고 LRU 순서를 갱신한다. 초기 준비가 끝나기까지 필요한 다운로드 시간은 존재하며, 모든 맵을 동시에 GPU에 올리는 방식은 아니다.

UV2가 없는 모델의 좌표를 임의의 평면 UV로 복원한 실험은 라이트맵의 잘못된 부분을 읽어 표면에 얼룩을 만들었으므로 폐기했다. 또한 모든 재질의 삼각형을 잘라내는 실험도 배경 암벽을 손상시켜 폐기했다. 최종 코드에는 두 실험이 포함되지 않는다.

검증: 관련 Node 테스트 46개 통과. 사막/도시/산업 맵 및 사막 연합방어 브라우저 캡처에서 JS/콘솔 오류 없음. 원본과 같은 카메라·완전 동일한 Unity 셰이더 재현까지 확정한 것은 아니다.

- [수정 전후 비교](/workspace/artifacts/map-dark-tiles-and-area-comparison.png)
- [사막 일반 전장](/workspace/artifacts/map-area-fixed-act1autochess_m01.png)
- [사막 연합방어](/workspace/artifacts/map-area-fixed-unite.png)
- [도시](/workspace/artifacts/map-area-fixed-act2autochess_m01.png)
- [산업](/workspace/artifacts/map-area-fixed-act2autochess_m03.png)

커밋/푸시/운영 서버 반영 없이 로컬 테스트에만 적용했다.

## 그림자 복구 — 사용자 지적 반영

위 추가 수정에서 원본 라이트맵이 있는 정적 모델의 `castShadow`/`receiveShadow`를 끈 조치는 사용자 의도보다 범위가 넓었다. 해당 조치는 철회하고 기존 실시간 그림자 생성/수신을 복구했다. 선행 캐시 로딩과 전장 영역 제한은 유지했다. 관련 테스트 46개 통과.

사막의 국소적인 짙은 타일을 일반 그림자와 구분해 조사하고 있다. 라이트맵·실시간 그림자·노멀을 각각 바꾸는 진단 캡처를 남겼다. 렌더러 그림자 활성 플래그만 바꾸는 비교는 이미 컴파일된 재질의 그림자 경로가 갱신되는지도 추가로 확인해야 하므로, 이 캡처만으로 라이트맵·재질·원본 지형 중 어느 하나를 원인으로 확정하지 않는다. 이전 설명의 '중복 그림자 원인 확정/해결' 주장은 철회한다.

[그림자 복구 화면](/workspace/artifacts/desert-shadow-restored.png)


## 최종 원인: UV2 없는 타일을 `(0,0)`으로 내보낸 오류

사용자가 지적한 **특정 타일 전체의 밝기 차이**를 주변의 정상적인 투영 그림자와 혼동했던 판단을 바로잡았다. 원본 `S_Ground_hide01_320`의 UV2 스트림은 실제로 비어 있고 UV0 스트림은 존재한다. 원본 렌더러 ST는 `(0.35532135, 0.35532135, 0.08933510, 0.53312129)`이며, UV0 첫 좌표는 `(0.3146235, 0.8843778)`이다. 이 타일에 ST만 사용하면 조명 텍스처의 한 점을 전체 면에 고정 적용한다. 다른 타일의 ST에는 음수 offset도 있어 잘못된 좌표가 아틀라스 바깥으로 나가며, ClampToEdge로 엉뚱한 어두운 가장자리를 읽는다.

수정은 UV2가 없는 메시에서 원본 UV0를 조명 UV의 fallback으로 사용하고, 비배칭 메시의 ST를 그 좌표에 적용하는 것이다. 정적 배칭 메시의 UV2는 기존처럼 그대로 유지하여 ST를 중복 적용하지 않는다. 임의 평면 UV 생성/전체 밝기 보정/그림자 제거는 사용하지 않는다. 공통 변환은 `tools/local-extract/map_geometry.py`의 `lightmap_uv` 함수로 분리했다.

- 사막 전장 01의 아틀라스 외부 조명 좌표: **2,600개 → 0개**.
- 원본 맵 **11종 모두** 유한한 조명 UV이며 아틀라스 외부 좌표 0개.
- 원본 정적 모델/장치의 그림자 생성과 타일의 그림자 수신은 유지된다.
- 사막/도시/공업 및 사막 연합방어 캡처에 JS·콘솔 오류 없음.
- 관련 테스트 **51개 통과**, 누락 UV2 fallback과 기존 배칭 UV 유지에 대한 회귀 검증 포함.
- 장면 파일은 `-v14.json.gz`로 재생성하여 이전 잘못된 데이터 캐시를 재사용하지 않는다. 캐시 전체를 지울 필요는 없다.

[동일 전장·카메라 수정 전후 및 확대 비교](/workspace/artifacts/desert-tile-lightmap-comparison.png) · [최종 사막 화면](/workspace/artifacts/map-uv-fixed-act1autochess_m01.png) · [맵 11종 UV 검증](/workspace/artifacts/map-uv-validation.json)

로컬만 반영했다. 커밋·푸시·운영 반영은 하지 않았다.
