# 상품 관리 페이지 (로컬 전용)

Supabase의 `products` · `product_storage` · `product_cautions` 테이블을 조회 · 검색하고, 상품을 추가 · 삭제하는 React(Vite) 페이지.
상품 데이터는 코드에 넣지 않고 Supabase에서 읽는다.

## 준비 (처음 한 번)

1. **Node.js LTS 설치**: https://nodejs.org 또는 PowerShell에서 `winget install OpenJS.NodeJS.LTS` → 터미널을 새로 연다
2. **Supabase 테이블 · 데이터** (SQL Editor에서 순서대로 Run)
   - `docs/dummy/supabase_csv/schema.sql` — 테이블
   - `docs/dummy/supabase_csv/seed.sql` — 데이터
   - `rls_write.sql`은 **실행하지 않는다** (추가 · 삭제는 service_role 키로 처리). 이미 실행했다면 파일 아래의 "되돌리기"를 실행한다
3. **연결 정보**: `.env.local`에 세 값을 넣는다 (Supabase 대시보드 → Project Settings)

   | 항목 | 어디서 | 용도 |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Data API → Project URL | 연결 주소 |
   | `VITE_SUPABASE_ANON_KEY` | API Keys → anon / publishable | 조회 (브라우저) |
   | `SUPABASE_SERVICE_ROLE_KEY` | API Keys → service_role / secret | 추가 · 삭제 (개발 서버만) |

   - Session pooler 등 DB 접속 문자열(`postgresql://...`)은 쓰지 않는다
   - service_role 키 앞에 `VITE_`를 붙이지 않는다. 붙이면 브라우저 코드에 들어가 노출된다
4. **패키지 설치**: 이 폴더에서 `npm install`

## 구조 (키가 쓰이는 곳)

```
브라우저 ──조회(anon 키)──────────────────────────▶ Supabase
브라우저 ──추가·삭제──▶ 개발 서버 /api/products ──(service_role 키)──▶ Supabase
```

- service_role 키는 `vite.config.js`의 개발 서버 안에서만 쓰이고 브라우저로 보내지지 않는다
- `/api/products`는 이 페이지(127.0.0.1:5173)에서 보낸 요청만 받는다
- `.env.local`을 고친 뒤에는 개발 서버를 다시 켜야 적용된다

## 실행

```
npm run dev
```

브라우저에서 http://127.0.0.1:5173 을 연다. 이 PC에서만 열린다.

## 기능

- 목록: 코드 · 상품명 · 분류 · 원산지 · 규격 · 판매가 · 알레르기 표시
- 검색: 상품명 · 코드 · 원산지 · 원재료 · 설명 · 알레르기 성분 (입력 즉시 필터)
- 필터: 분류, 알레르기 주의만 (`없음` · `미확인`은 알레르기로 보지 않음)
- 상세: 행을 누르면 오른쪽에 전체 필드 · 보관 조건 · 주의사항
- 추가: `+ 상품 추가` (상품코드는 `P-0000` 형식, 중복 불가)
- 삭제: 상세 아래 `상품 삭제` → 확인 후 삭제. 보관 · 주의사항도 함께 지워진다

## 아직 없는 것

- 상품 정보 수정
- 보관 조건 · 주의사항 추가 · 삭제 (Supabase Table Editor에서 직접)
