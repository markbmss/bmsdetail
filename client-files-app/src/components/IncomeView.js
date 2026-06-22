const font = "'Heebo', system-ui, sans-serif"

function fmt(n) {
  return '₪' + Number(n).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-')
  const d = new Date(+y, +m - 1, 1)
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}

const card = (children, style = {}) => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '0.5px solid #e0ddd6',
    padding: '18px 20px', ...style
  }}>{children}</div>
)

export default function IncomeView({ clients }) {
  const allPayments = clients.flatMap(c =>
    (c.payments || []).map(p => ({ ...p, clientName: c.name, clientCar: c.car }))
  )

  const totalIncome = allPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const payingClients = clients.filter(c => c.payments && c.payments.length > 0).length

  // Per-client totals
  const clientRows = clients
    .map(c => ({
      id: c.id,
      name: c.name,
      car: c.car,
      count: (c.payments || []).length,
      total: (c.payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0),
      lastDate: [...(c.payments || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]?.date || null
    }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.total - a.total)

  // Monthly breakdown
  const byMonth = {}
  allPayments.forEach(p => {
    if (!p.date) return
    const key = p.date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { count: 0, total: 0 }
    byMonth[key].count++
    byMonth[key].total += parseFloat(p.amount || 0)
  })
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))

  const thStyle = {
    textAlign: 'start', fontSize: 11, fontWeight: 600, color: '#999',
    padding: '0 12px 10px', textTransform: 'uppercase', letterSpacing: '0.5px'
  }
  const tdStyle = {
    padding: '11px 12px', fontSize: 13, color: '#1a1a1a',
    borderTop: '0.5px solid #f0ede8'
  }

  return (
    <div dir="rtl" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: font, maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>הכנסות</div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {card(
          <>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>סה״כ הכנסות</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', direction: 'ltr' }}>{fmt(totalIncome)}</div>
          </>
        )}
        {card(
          <>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>עסקאות</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{allPayments.length}</div>
          </>
        )}
        {card(
          <>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>לקוחות משלמים</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{payingClients}</div>
          </>
        )}
      </div>

      {/* Per-client breakdown */}
      {card(
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>לפי לקוח</div>
          {clientRows.length === 0 ? (
            <div style={{ fontSize: 13, color: '#aaa', padding: '12px 0' }}>אין נתוני תשלום עדיין</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>לקוח</th>
                  <th style={thStyle}>רכב</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>טיפולים</th>
                  <th style={{ ...thStyle, textAlign: 'end' }}>תאריך אחרון</th>
                  <th style={{ ...thStyle, textAlign: 'end' }}>סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fafaf8' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ ...tdStyle, color: '#777' }}>{r.car || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{r.count}</td>
                    <td style={{ ...tdStyle, textAlign: 'end', color: '#777', direction: 'ltr' }}>
                      {r.lastDate ? new Date(r.lastDate).toLocaleDateString('he-IL') : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'end', fontWeight: 700, color: '#1a1a1a', direction: 'ltr' }}>{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, borderTop: '1.5px solid #e0ddd6' }}>סה״כ</td>
                  <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'end', direction: 'ltr', borderTop: '1.5px solid #e0ddd6', color: '#378ADD', fontSize: 14 }}>{fmt(totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </>
      )}

      {/* Monthly breakdown */}
      {months.length > 0 && card(
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>לפי חודש</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>חודש</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>עסקאות</th>
                <th style={{ ...thStyle, textAlign: 'end' }}>הכנסה</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([key, val], i) => (
                <tr key={key} style={{ background: i % 2 === 0 ? '#fafaf8' : '#fff' }}>
                  <td style={tdStyle}>{monthLabel(key)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{val.count}</td>
                  <td style={{ ...tdStyle, textAlign: 'end', fontWeight: 600, direction: 'ltr' }}>{fmt(val.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  )
}
