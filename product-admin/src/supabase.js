import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// 조회용 (anon 키). .env.local이 비어 있으면 null — 화면에서 설정 안내를 보여 준다
export const supabase = url && key ? createClient(url, key) : null

// 추가 · 삭제는 개발 서버의 /api/products 로 보낸다 (service_role 키는 서버에만 있음)
// 성공하면 null, 실패하면 { code, message } 를 돌려준다
export async function adminRequest(method, path, body) {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.ok) return null
    const data = await res.json().catch(() => ({}))
    return data.error ?? { message: `요청 실패 (${res.status})` }
  } catch (e) {
    return { message: e.message }
  }
}

// Supabase · API 오류를 화면에 보여 줄 한국어 문장으로 바꾼다
export function explainError(error) {
  if (!error) return ''
  const msg = error.message ?? ''
  if (error.code === '23505') return '이미 있는 상품코드예요. 다른 코드를 입력해 주세요.'
  if (error.code === '23514') return '입력값이 허용 범위를 벗어났어요. (예: 판매가는 0 이상)'
  if (error.code === 'NO_SERVICE_KEY') {
    return '추가 · 삭제용 키가 없어요. .env.local의 SUPABASE_SERVICE_ROLE_KEY를 채우고 개발 서버를 다시 켜 주세요.'
  }
  if (error.code === 'NOT_FOUND') return '이미 삭제된 상품이에요. 새로고침해 주세요.'
  if (error.code === '42501' || /row-level security/i.test(msg)) {
    return '권한이 없어요. SUPABASE_SERVICE_ROLE_KEY에 anon이 아닌 service_role(secret) 키를 넣었는지 확인해 주세요.'
  }
  if (/invalid api key|jwt/i.test(msg)) return 'Supabase 키가 올바르지 않아요. .env.local의 키를 다시 확인해 주세요.'
  if (/Failed to fetch/i.test(msg)) return 'Supabase에 연결할 수 없어요. URL과 인터넷 연결을 확인해 주세요.'
  return msg
}
