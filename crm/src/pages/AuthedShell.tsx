import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function AuthedShell() {
  const { session } = useAuth()

  return (
    <div className="authed-shell">
      <header>
        <span>BMS Detail CRM</span>
        <div className="authed-shell-user">
          <span>{session?.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      <main>
        <p>Logged in. Today dashboard, Leads, and Customers screens come next.</p>
      </main>
    </div>
  )
}
