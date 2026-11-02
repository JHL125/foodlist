import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'

const PORT = 5173
const ALLOWED_ORIGINS = [`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]
// 추가할 때 받는 컬럼 (그 밖의 값은 버린다)
const PRODUCT_COLUMNS = [
  'product_id', 'product_name', 'category', 'origin', 'ingredients', 'spec',
  'price', 'sale_period', 'description', 'allergens', 'cross_contact',
]

// 상품 추가 · 삭제 API — 개발 서버(이 PC) 안에서만 service_role 키를 쓴다
// 브라우저는 /api/products 로 요청만 보내고, 키는 브라우저로 가지 않는다
function adminApi(env) {
  const url = env.VITE_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  const admin = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null

  const send = (res, status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }

  const readJson = (req) => new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })

  async function handler(req, res, next) {
    if (!req.url.startsWith('/api/products')) return next()

    // 다른 웹사이트가 이 PC의 API를 몰래 호출하지 못하게, 이 페이지에서 온 요청만 받는다
    const origin = req.headers.origin
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return send(res, 403, { error: { code: 'FORBIDDEN_ORIGIN', message: '이 페이지에서 보낸 요청만 처리합니다.' } })
    }
    if (!admin) {
      return send(res, 500, { error: { code: 'NO_SERVICE_KEY', message: 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' } })
    }

    try {
      if (req.method === 'POST' && req.url === '/api/products') {
        if (!req.headers['content-type']?.startsWith('application/json')) {
          return send(res, 415, { error: { message: 'JSON으로 보내 주세요.' } })
        }
        const body = await readJson(req)
        const row = Object.fromEntries(PRODUCT_COLUMNS.filter((c) => c in body).map((c) => [c, body[c]]))
        const { error } = await admin.from('products').insert(row)
        return error ? send(res, 400, { error }) : send(res, 201, { ok: true })
      }

      const match = req.url.match(/^\/api\/products\/([^/?]+)$/)
      if (req.method === 'DELETE' && match) {
        const id = decodeURIComponent(match[1])
        // 보관 · 주의사항은 외래키 on delete cascade로 함께 지워진다
        const { data, error } = await admin.from('products').delete().eq('product_id', id).select('product_id')
        if (error) return send(res, 400, { error })
        if (!data.length) return send(res, 404, { error: { code: 'NOT_FOUND', message: '이미 없는 상품입니다.' } })
        return send(res, 200, { ok: true })
      }

      return send(res, 405, { error: { message: '지원하지 않는 요청입니다.' } })
    } catch (e) {
      return send(res, 500, { error: { message: e.message } })
    }
  }

  return {
    name: 'admin-api',
    configureServer(server) { server.middlewares.use(handler) },
    configurePreviewServer(server) { server.middlewares.use(handler) },
  }
}

export default defineConfig(({ mode }) => {
  // '' : VITE_ 가 없는 값(service_role 키)도 읽는다 — 이 설정 파일(Node) 안에서만 쓰이고 브라우저 코드에는 들어가지 않는다
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), adminApi(env)],
    // 로컬 전용: 이 PC(127.0.0.1)에서만 열고, 다른 사이트의 교차 요청(CORS)은 허용하지 않는다
    server: { host: '127.0.0.1', port: PORT, strictPort: true, cors: false },
    preview: { host: '127.0.0.1', port: PORT, strictPort: true, cors: false },
  }
})
