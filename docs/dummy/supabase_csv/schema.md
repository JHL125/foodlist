# Supabase 스키마 정리 (실습 전용)

> 원본: `docs/dummy/products_db.xlsx` → 같은 폴더의 CSV 4개. 가상 상품 데이터이며 실제 데이터에 섞지 않는다.
> SQL은 직접 작성한다. 이 문서는 CSV와 맞는 컬럼 · 타입 · 제약만 정리한다.
> CSV 헤더는 아래 컬럼명과 같다. 인코딩은 UTF-8(BOM 없음)이라 엑셀에서 바로 열면 한글이 깨질 수 있다. 내용은 `products_db.xlsx`에서 고친다.

## 테이블 관계

```
products (1) ──< product_storage  (N)   product_id로 연결
products (1) ──< product_cautions (N)   product_id로 연결
shipping_policy (1행, 독립)
```

## products — `products.csv` (10행)

| 컬럼 | 타입 | NULL | 제약 · 비고 |
|---|---|---|---|
| product_id | text | 불가 | **기본키**. 예: `P-0113` |
| product_name | text | 불가 | |
| category | text | 가능 | 가안 값. 과일 / 채소 / 가공식품 / 냉동식품 / 건강식품 |
| origin | text | 가능 | 납작만두는 `미확인` |
| ingredients | text | 가능 | |
| spec | text | 가능 | 단위가 제각각이라 텍스트 |
| price | integer | 불가 | 원 단위. `>= 0` |
| sale_period | text | 가능 | 성주 참외만 값 있음 (9행 NULL) |
| description | text | 가능 | |
| allergens | text | 가능 | `없음` 또는 `밀, 대두` |
| cross_contact | text | 가능 | `없음` / `견과류` / `계란` |

## product_storage — `product_storage.csv` (16행)

| 컬럼 | 타입 | NULL | 제약 · 비고 |
|---|---|---|---|
| id | bigint identity | 불가 | **기본키**. CSV에 없음, 자동 생성 |
| product_id | text | 불가 | **외래키** → products.product_id (on delete cascade 권장) |
| stage | text | 불가 | check: `개봉 전` / `개봉 후` / `수령 후` |
| storage_type | text | **가능** | check: `상온` / `냉장` / `냉동`. NULL 2행 (P-0318 개봉 후, P-0421 개봉 전) |
| days | integer | **가능** | 일 단위, 1개월 = 30일. NULL 1행 (P-0421 개봉 전) |
| note | text | 가능 | 원문 표현 |

## product_cautions — `product_cautions.csv` (16행)

| 컬럼 | 타입 | NULL | 제약 · 비고 |
|---|---|---|---|
| id | bigint identity | 불가 | **기본키**. CSV에 없음, 자동 생성 |
| product_id | text | 불가 | **외래키** → products.product_id (on delete cascade 권장) |
| area | text | 불가 | check: `보관` / `조리` / `도구` / `섭취` |
| level | text | 불가 | check: `금지` / `주의` / `권장` |
| content | text | 불가 | |
| reason | text | **가능** | NULL 6행 |

## shipping_policy — `shipping_policy.csv` (1행)

엑셀의 '항목–값' 형태를 컬럼마다 타입이 있는 1행 테이블로 펼쳤다.

| 컬럼 | 타입 | NULL | 제약 · 비고 |
|---|---|---|---|
| id | bigint identity 또는 고정값 1 | 불가 | 기본키. CSV에 없음 |
| free_shipping_min | integer | 불가 | 30000 |
| base_fee | integer | 불가 | 2500 |
| same_day_regions | text | 불가 | `수성구, 달서구` (쉼표 구분 텍스트) |
| same_day_cutoff | time | 불가 | `14:00` |
| fresh_ship_days | text | 불가 | `월~목` |

## 가져오기 순서 (Table Editor → Import data from CSV)

1. `products.csv` — 외래키가 참조하는 쪽이라 반드시 먼저
2. `product_storage.csv`, `product_cautions.csv`
3. `shipping_policy.csv`

- `id` 컬럼은 CSV에 없으므로 가져오기 화면에서 매핑하지 않는다.
- 테이블을 만들면 RLS 경고가 뜬다. 앱에서 읽기만 한다면 select 정책을 추가한다.

## 결정할 것

- [ ] `미확인` · `없음`을 텍스트로 둘지, NULL로 바꿀지 (지금 CSV는 텍스트 그대로)
- [ ] `same_day_regions`를 text 그대로 둘지, text[] 배열로 바꿀지 (배열이면 CSV 값을 `{수성구,달서구}`로 바꿔야 함)
- [ ] 분류(category) 기준 확정
