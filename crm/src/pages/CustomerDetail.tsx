import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Car, Coating } from '../lib/types'
import {
  fetchCustomerDetail,
  updateCustomer,
  createCar,
  updateCar,
  createCoating,
  updateCoating,
  type CustomerDetail as CustomerDetailData,
  type CustomerInput,
  type CarInput,
  type CoatingInput,
} from '../lib/customers'
import { getCoatingStatus } from '../lib/coatingStatus'
import { jobStatusLabel } from '../lib/customers'
import { waLink, callLink } from '../lib/dates'
import CustomerForm from '../components/CustomerForm'
import CarForm from '../components/CarForm'
import CoatingForm from '../components/CoatingForm'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<CustomerDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingCustomer, setEditingCustomer] = useState(false)
  const [addingCar, setAddingCar] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [addingCoatingForCar, setAddingCoatingForCar] = useState<string | null>(null)
  const [editingCoating, setEditingCoating] = useState<Coating | null>(null)

  async function reload() {
    if (!id) return
    setLoading(true)
    try {
      setData(await fetchCustomerDetail(id))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSaveCustomer(input: CustomerInput) {
    if (!id) return
    await updateCustomer(id, input)
    setEditingCustomer(false)
    await reload()
  }

  async function handleSaveCar(input: CarInput) {
    if (!id) return
    if (editingCar) {
      await updateCar(editingCar.id, input)
      setEditingCar(null)
    } else {
      await createCar(id, input)
      setAddingCar(false)
    }
    await reload()
  }

  async function handleSaveCoating(input: CoatingInput) {
    if (editingCoating) {
      await updateCoating(editingCoating.id, input)
      setEditingCoating(null)
    } else if (addingCoatingForCar) {
      await createCoating(addingCoatingForCar, input)
      setAddingCoatingForCar(null)
    }
    await reload()
  }

  if (loading) return <p className="today-status">טוען לקוח…</p>
  if (error) return <p className="today-status today-error">שגיאה: {error}</p>
  if (!data) return null

  const { customer, cars, coatings, jobs } = data
  const wa = waLink(customer.phone)
  const call = callLink(customer.phone)

  return (
    <div className="customer-detail">
      <Link to="/customers" className="back-link">
        → לקוחות
      </Link>

      <div className="customer-header">
        <div>
          <h1>{customer.name}</h1>
          <p className="customer-header-meta">
            {[
              customer.city,
              customer.phone && (
                <span key="phone" className="ltr">
                  {customer.phone}
                </span>
              ),
              customer.email && (
                <span key="email" className="ltr">
                  {customer.email}
                </span>
              ),
            ]
              .filter(Boolean)
              .flatMap((part, i) => (i === 0 ? [part] : [' · ', part]))}
          </p>
          {customer.notes && <p className="form-hint">{customer.notes}</p>}
        </div>
        <div className="customer-header-actions">
          {call && (
            <a className="reminder-row-call" href={call} title="התקשר">
              התקשר
            </a>
          )}
          {wa && (
            <a className="reminder-row-wa" href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
          <button className="btn-secondary" onClick={() => setEditingCustomer(true)}>
            עריכה
          </button>
        </div>
      </div>

      <section className="reminder-section">
        <h2>
          רכבים <span className="reminder-count">{cars.length}</span>
          <button className="btn-secondary section-add-btn" onClick={() => setAddingCar(true)}>
            + הוספת רכב
          </button>
        </h2>

        {cars.length === 0 && <p className="reminder-empty">אין רכבים רשומים.</p>}

        {cars.map((car) => {
          const carCoatings = coatings.filter((c) => c.car_id === car.id)
          return (
            <div key={car.id} className="car-card">
              <div className="car-card-header">
                <div>
                  <span className="lead-row-name">{car.make_model ?? 'רכב ללא שם'}</span>
                  <span className="lead-row-meta">
                    {[car.plate, car.color, car.year].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="customer-header-actions">
                  <button className="btn-secondary" onClick={() => setAddingCoatingForCar(car.id)}>
                    + הוספת ציפוי
                  </button>
                  <button className="btn-secondary" onClick={() => setEditingCar(car)}>
                    עריכה
                  </button>
                </div>
              </div>

              {carCoatings.length === 0 ? (
                <p className="reminder-empty">אין ציפויים רשומים לרכב זה.</p>
              ) : (
                <ul className="coatings-list">
                  {carCoatings.map((coating) => {
                    const status = getCoatingStatus(coating)
                    return (
                      <li key={coating.id} className="coating-row" onClick={() => setEditingCoating(coating)}>
                        <span className="board-card-name">{coating.product ?? 'ציפוי'}</span>
                        <span className={`coating-status coating-status-${status.boosterLevel}`}>
                          {status.boosterLabel}
                        </span>
                        <span className={`coating-status coating-status-${status.warrantyLevel}`}>
                          {status.warrantyLabel}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </section>

      <section className="reminder-section">
        <h2>
          היסטוריית עבודות <span className="reminder-count">{jobs.length}</span>
        </h2>
        {jobs.length === 0 ? (
          <p className="reminder-empty">אין עבודות רשומות עדיין.</p>
        ) : (
          <ul className="leads-list">
            {jobs.map((job) => (
              <li key={job.id} className="lead-row">
                <div className="lead-row-main">
                  <span className="lead-row-name">{job.service ?? 'עבודה'}</span>
                  <span className="lead-row-meta">{job.job_date ?? 'ללא תאריך'}</span>
                </div>
                <span className={`status-badge status-${job.status}`}>{jobStatusLabel(job.status)}</span>
                {job.price != null && <span className="lead-row-meta">₪{job.price}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingCustomer && (
        <CustomerForm customer={customer} onClose={() => setEditingCustomer(false)} onSave={handleSaveCustomer} />
      )}
      {addingCar && <CarForm car={null} onClose={() => setAddingCar(false)} onSave={handleSaveCar} />}
      {editingCar && <CarForm car={editingCar} onClose={() => setEditingCar(null)} onSave={handleSaveCar} />}
      {addingCoatingForCar && (
        <CoatingForm coating={null} onClose={() => setAddingCoatingForCar(null)} onSave={handleSaveCoating} />
      )}
      {editingCoating && (
        <CoatingForm coating={editingCoating} onClose={() => setEditingCoating(null)} onSave={handleSaveCoating} />
      )}
    </div>
  )
}
