import { useEffect, useMemo, useState } from 'react'
import { supabase, adminRequest, explainError } from './supabase.js'
import ProductDetail from './ProductDetail.jsx'
import ProductForm from './ProductForm.jsx'
import { hasValue } from './utils.js'

// 검색어와 비교할 필드
const SEARCH_FIELDS = ['product_id', 'product_name', 'origin', 'ingredients', 'description', 'allergens', 'cross_contact']

export default function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [allergyOnly, setAllergyOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    // 보관 · 주의사항은 외래키로 연결되어 있어 한 번에 함께 가져온다
    const { data, error } = await supabase
      .from('products')
      .select('*, product_storage(*), product_cautions(*)')
      .order('product_id')
    if (error) setError(explainError(error))
    else setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    if (supabase) load()
  }, [])

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category && p.category !== category) return false
      if (allergyOnly && !hasValue(p.allergens) && !hasValue(p.cross_contact)) return false
      if (!q) return true
      return SEARCH_FIELDS.some((f) => (p[f] ?? '').toLowerCase().includes(q))
    })
  }, [products, query, category, allergyOnly])

  const selected = products.find((p) => p.product_id === selectedId) ?? null

  async function handleAdd(row) {
    const error = await adminRequest('POST', '/api/products', row)
    if (error) return explainError(error) // 폼에 오류를 보여 준다
    setShowForm(false)
    setNotice(`${row.product_name}(${row.product_id})을(를) 추가했어요.`)
    await load()
    setSelectedId(row.product_id)
    return ''
  }

  async function handleDelete(p) {
    const ok = window.confirm(
      `${p.product_name}(${p.product_id})을(를) 삭제할까요?\n보관 조건과 주의사항도 함께 삭제되며 되돌릴 수 없어요.`,
    )
    if (!ok) return
    const error = await adminRequest('DELETE', `/api/products/${encodeURIComponent(p.product_id)}`)
    if (error) return setError(explainError(error))
    setSelectedId(null)
    setNotice(`${p.product_name}(${p.product_id})을(를) 삭제했어요.`)
    await load()
  }

  if (!supabase) return <SetupGuide />

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>상품 관리</h1>
          <p className="sub">실습용 가상 상품 · Supabase 연결</p>
        </div>
        <button className="primary" onClick={() => { setShowForm(true); setNotice('') }}>+ 상품 추가</button>
      </header>

      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="상품명, 코드, 원산지, 원재료, 알레르기 성분으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">전체 분류</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={allergyOnly} onChange={(e) => setAllergyOnly(e.target.checked)} />
          알레르기 주의만
        </label>
        <button onClick={load} disabled={loading}>새로고침</button>
      </div>

      {error && <div className="alert error" onClick={() => setError('')}>{error} <span className="x">닫기</span></div>}
      {notice && <div className="alert ok" onClick={() => setNotice('')}>{notice} <span className="x">닫기</span></div>}

      <main className="layout">
        <section className="list">
          <div className="count">
            {loading ? '불러오는 중…' : `${filtered.length}건${filtered.length !== products.length ? ` / 전체 ${products.length}건` : ''}`}
          </div>
          <table>
            <thead>
              <tr>
                <th>코드</th><th>상품명</th><th>분류</th><th>원산지</th><th>규격</th><th className="num">판매가</th><th>알레르기</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.product_id}
                  className={p.product_id === selectedId ? 'selected' : ''}
                  onClick={() => setSelectedId(p.product_id)}
                >
                  <td className="mono">{p.product_id}</td>
                  <td>{p.product_name}</td>
                  <td>{p.category ?? '-'}</td>
                  <td className={p.origin === '미확인' ? 'muted' : ''}>{p.origin ?? '-'}</td>
                  <td>{p.spec ?? '-'}</td>
                  <td className="num">{p.price.toLocaleString()}원</td>
                  <td>
                    {hasValue(p.allergens) && <span className="badge red">함유</span>}
                    {!hasValue(p.allergens) && hasValue(p.cross_contact) && <span className="badge amber">교차오염</span>}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="empty">조건에 맞는 상품이 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <aside className="detail">
          {selected
            ? <ProductDetail product={selected} onDelete={handleDelete} onClose={() => setSelectedId(null)} />
            : <div className="placeholder">목록에서 상품을 선택하면 상세 정보가 여기에 보여요.</div>}
        </aside>
      </main>

      {showForm && (
        <ProductForm
          categories={categories}
          existingIds={products.map((p) => p.product_id)}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function SetupGuide() {
  return (
    <div className="app setup">
      <h1>Supabase 연결 설정이 필요해요</h1>
      <ol>
        <li><code>product-admin/.env.local</code> 파일을 열어요.</li>
        <li>Supabase 대시보드 → Project Settings에서 세 값을 복사해 <code>=</code> 뒤에 붙여 넣고 저장해요.
          <ul>
            <li><code>VITE_SUPABASE_URL</code>: Data API → Project URL</li>
            <li><code>VITE_SUPABASE_ANON_KEY</code>: API Keys → anon(publishable) 키 — 조회용</li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code>: API Keys → service_role(secret) 키 — 추가 · 삭제용</li>
          </ul>
        </li>
        <li>개발 서버를 껐다가 다시 켜요 (<code>npm run dev</code>).</li>
      </ol>
    </div>
  )
}
