import { hasValue } from './utils.js'

// 시점 → 표시 순서
const STAGE_ORDER = { '개봉 전': 0, '수령 후': 1, '개봉 후': 2 }
const LEVEL_ORDER = { 금지: 0, 주의: 1, 권장: 2 }
const LEVEL_CLASS = { 금지: 'red', 주의: 'amber', 권장: 'blue' }

export default function ProductDetail({ product: p, onDelete, onClose }) {
  const storage = [...p.product_storage].sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || a.id - b.id)
  const cautions = [...p.product_cautions].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.id - b.id)

  return (
    <div>
      <div className="detail-head">
        <div>
          <div className="mono muted">{p.product_id}</div>
          <h2>{p.product_name}</h2>
        </div>
        <button className="ghost" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      <dl className="fields">
        <Field label="분류" value={p.category} />
        <Field label="원산지" value={p.origin} />
        <Field label="원재료" value={p.ingredients} />
        <Field label="규격" value={p.spec} />
        <Field label="판매가" value={`${p.price.toLocaleString()}원`} />
        <Field label="판매기간" value={p.sale_period ?? '상시'} />
        <Field label="설명" value={p.description} />
        <Field label="알레르기 성분" value={p.allergens} warn={hasValue(p.allergens)} />
        <Field label="교차오염 주의" value={p.cross_contact} warn={hasValue(p.cross_contact)} />
      </dl>

      <h3>보관</h3>
      {storage.length ? (
        <table className="mini">
          <thead><tr><th>시점</th><th>방식</th><th>기간</th><th>비고</th></tr></thead>
          <tbody>
            {storage.map((s) => (
              <tr key={s.id}>
                <td>{s.stage}</td>
                <td>{s.storage_type ?? '-'}</td>
                <td>{s.days == null ? <span className="muted">미확인</span> : `${s.days}일`}</td>
                <td>{s.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">등록된 보관 정보가 없어요.</p>}

      <h3>주의사항</h3>
      {cautions.length ? (
        <ul className="cautions">
          {cautions.map((c) => (
            <li key={c.id}>
              <span className={`badge ${LEVEL_CLASS[c.level]}`}>{c.level}</span>
              <span className="area">{c.area}</span>
              <span className={c.level === '금지' ? 'strong' : ''}>{c.content}</span>
              {c.reason && <span className="muted"> — {c.reason}</span>}
            </li>
          ))}
        </ul>
      ) : <p className="muted">등록된 주의사항이 없어요.</p>}

      <div className="danger-zone">
        <button className="danger" onClick={() => onDelete(p)}>상품 삭제</button>
      </div>
    </div>
  )
}

function Field({ label, value, warn }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={warn ? 'warn' : value === '미확인' ? 'muted' : ''}>{value ?? '-'}</dd>
    </>
  )
}
