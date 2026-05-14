import { useState } from 'react'

const expectedPassword = process.env.REACT_APP_APP_PASSWORD

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (!expectedPassword) {
        setError('האפליקציה לא הוגדרה: חסר REACT_APP_APP_PASSWORD (בדוק .env.local או Netlify).')
      } else if (password === expectedPassword) {
        sessionStorage.setItem('app_auth', 'true')
        onLogin()
      } else {
        setError('סיסמה שגויה. נסה שוב.')
      }
      setLoading(false)
    }, 200)
  }

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4f1', fontFamily: "'Heebo', system-ui, sans-serif"
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, border: '0.5px solid #e0ddd6',
        padding: '40px 36px', width: '100%', maxWidth: 380, boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, fontSize: 22
          }}>📁</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>קבצי לקוחות</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>גישה לצוות בלבד — הזן סיסמה</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            placeholder="סיסמת צוות"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            style={{
              padding: '10px 14px', fontSize: 14, borderRadius: 8,
              border: `1px solid ${error ? '#e24b4a' : '#ddd'}`,
              outline: 'none', width: '100%', boxSizing: 'border-box'
            }}
          />
          {error && <p style={{ fontSize: 12, color: '#e24b4a', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: '10px', fontSize: 14, fontWeight: 500, borderRadius: 8,
              border: 'none', background: '#1a1a1a', color: '#fff',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.6 : 1
            }}
          >
            {loading ? 'בודק...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
