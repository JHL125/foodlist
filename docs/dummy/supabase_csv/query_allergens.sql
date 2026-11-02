-- 알레르기 주의 상품 조회 (실습 전용 · 가상 상품 데이터)
-- 실행: Supabase SQL Editor에 붙여 넣고 Run
-- 기준: allergens(직접 함유) 또는 cross_contact(생산 라인 공유)에 실제 성분이 적힌 상품
--       '없음'(해당 없음)과 '미확인'(정보 없음)은 알레르기 성분으로 보지 않는다
--       값이 NULL인 경우도 정보가 없는 것이므로 제외한다

-- 1) 함유 + 교차오염 모두 (예상 결과 3행: P-0402, P-0113, P-0421)
select
  product_id,
  product_name,
  allergens,
  cross_contact,
  case
    when allergens not in ('없음', '미확인') then '함유'
    else '교차오염 주의'
  end as 구분
from public.products
where allergens not in ('없음', '미확인')
   or cross_contact not in ('없음', '미확인')
order by
  (allergens not in ('없음', '미확인')) desc nulls last,  -- 직접 함유 상품을 위에 (NULL은 아래로)
  product_id;

-- 2) 직접 함유만 (예상 결과 1행: P-0402 서문시장 납작만두)
-- select product_id, product_name, allergens
-- from public.products
-- where allergens not in ('없음', '미확인')
-- order by product_id;
