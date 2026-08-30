import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AuthedShell from './pages/AuthedShell'
import './App.css'

function Gate() {
  const { session, loading } = useAuth()

  if (loading) return <div className="app-loading">Loading…</div>
  return session ? <AuthedShell /> : <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
