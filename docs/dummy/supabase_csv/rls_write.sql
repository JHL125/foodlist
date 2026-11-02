-- 상품 추가 · 삭제 권한 (실습 전용 · 로컬 관리 페이지 product-admin용)
-- 실행: schema.sql을 실행한 뒤, Supabase SQL Editor에 붙여 넣고 Run
--
-- ⚠ 주의: anon 키를 가진 누구나 상품을 추가하고 삭제할 수 있게 된다.
--   anon 키는 브라우저 코드에 들어가므로 비밀이 아니다. 로컬에서 가상 데이터로 실습할 때만 쓴다.
--   실제 데이터를 넣거나 페이지를 배포하기 전에는 아래 "되돌리기"를 실행하고 로그인 기반 정책으로 바꾼다.
--
-- 보관 · 주의사항은 정책을 따로 열지 않는다.
--   상품을 삭제하면 외래키의 on delete cascade로 함께 지워지며, 이 연쇄 삭제는 RLS의 영향을 받지 않는다.

create policy "products 추가 허용 (로컬 실습)"
  on public.products for insert to anon, authenticated
  with check (true);

create policy "products 삭제 허용 (로컬 실습)"
  on public.products for delete to anon, authenticated
  using (true);

-- 되돌리기 (쓰기 권한 회수)
-- drop policy "products 추가 허용 (로컬 실습)" on public.products;
-- drop policy "products 삭제 허용 (로컬 실습)" on public.products;
