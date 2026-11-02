import { useState } from 'react'

const EMPTY = {
  product_id: '', product_name: '', category: '', origin: '', ingredients: '', spec: '',
  price: '', sale_period: '', description: '', allergens: '없음', cross_contact: '없음',
}

// (필드, 라벨, 입력 종류, 안내)
const FIELDS = [
  ['product_id', '상품코드 *', 'text', '예: P-0501'],
  ['product_name', '상품명 *', 'text', ''],
  ['category', '분류', 'category', ''],
  ['origin', '원산지', 'text', '모르면 미확인'],
  ['ingredients', '원재료', 'text', ''],
  ['spec', '규격', 'text', '예: 500g(10개)'],
  ['price', '판매가(원) *', 'number', ''],
  ['sale_period', '판매기간', 'text', '계절 상품만 (예: 4~7월)'],
  ['description', '상품설명', 'textarea', ''],
  ['allergens', '알레르기 성분', 'text', '없으면 없음, 모르면 미확인'],
  ['cross_contact', '교차오염 주의', 'text', '같은 생산 라인 성분'],
]

export default function ProductForm({ categories, existingIds, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function validate() {
    const id = form.product_id.trim()
    if (!/^P-\d{4}$/.test(id)) return '상품코드는 P-0000 형식으로 입력해 주세요.'
    if (existingIds.includes(id)) return '이미 있는 상품코드예요.'
    if (!form.product_name.trim()) return '상품명을 입력해 주세요.'
    if (form.price === '' || !Number.isInteger(Number(form.price)) || Number(form.price) < 0) {
      return '판매가는 0 이상의 정수로 입력해 주세요.'
    }
    return ''
  }

  async function submit(e) {
    e.preventDefault()
    const msg = validate()
    if (msg) return setError(msg)
    // 빈 칸은 NULL로 저장한다
    const row = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : String(v).trim()]),
    )
    row.price = Number(form.price)
    setSaving(true)
    const err = await onSubmit(row)
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>상품 추가</h2>
        <p className="muted small">보관 조건과 주의사항은 지금은 Supabase에서 직접 추가해요.</p>
        <div className="form-grid">
          {FIELDS.map(([key, label, type, hint]) => (
            <label key={key} className={type === 'textarea' ? 'full' : ''}>
              <span>{label}</span>
              {type === 'textarea' ? (
                <textarea rows={3} value={form[key]} onChange={set(key)} />
              ) : type === 'category' ? (
                <>
                  <input list="category-list" value={form[key]} onChange={set(key)} placeholder="목록에서 고르거나 입력" />
                  <datalist id="category-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </>
              ) : (
                <input
                  type={type}
                  min={type === 'number' ? 0 : undefined}
                  step={type === 'number' ? 1 : undefined}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={hint}
                />
              )}
            </label>
          ))}
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="actions">
          <button type="button" onClick={onCancel}>취소</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? '저장 중…' : '추가'}</button>
        </div>
      </form>
    </div>
  )
}
