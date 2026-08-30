import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Customer } from '../lib/types'
import { fetchCustomers, createCustomer, type CustomerInput } from '../lib/customers'
import { waLink } from '../lib/dates'
import CustomerForm from '../components/CustomerForm'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setCustomers(await fetchCustomers())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleCreate(input: CustomerInput) {
    const customer = await createCustomer(input)
    setCreating(false)
    navigate(`/customers/${customer.id}`)
  }

  const visible = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').includes(search) ||
          (c.city ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : customers

  return (
    <div className="customers-page">
      <div className="leads-header">
        <input
          className="customers-search"
          placeholder="Search by name, phone, or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setCreating(true)}>+ New customer</button>
      </div>

      {loading && <p className="today-status">Loading customers…</p>}
      {error && <p className="today-status today-error">Error: {error}</p>}

      {!loading && !error && (
        <ul className="leads-list">
          {visible.length === 0 && <p className="reminder-empty">No customers found.</p>}
          {visible.map((c) => {
            const phone = waLink(c.phone)
            return (
              <li key={c.id} className="lead-row">
                <div className="lead-row-main" onClick={() => navigate(`/customers/${c.id}`)}>
                  <span className="lead-row-name">{c.name}</span>
                  <span className="lead-row-meta">{[c.city, c.phone].filter(Boolean).join(' · ')}</span>
                </div>
                {phone && (
                  <a className="reminder-row-wa" href={phone} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {creating && <CustomerForm customer={null} onClose={() => setCreating(false)} onSave={handleCreate} />}
    </div>
  )
}
