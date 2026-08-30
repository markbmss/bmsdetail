import { NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Today from './Today'
import Leads from './Leads'
import Customers from './Customers'
import CustomerDetail from './CustomerDetail'

export default function AuthedShell() {
  const { session } = useAuth()

  return (
    <div className="authed-shell">
      <header>
        <div className="authed-shell-brand">
          <span>BMS Detail CRM</span>
          <nav>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
              Today
            </NavLink>
            <NavLink
              to="/leads"
              className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            >
              Leads
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
            >
              Customers
            </NavLink>
          </nav>
        </div>
        <div className="authed-shell-user">
          <span>{session?.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </main>
    </div>
  )
}
