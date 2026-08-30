export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'done' | 'lost'
export type JobStatus = 'scheduled' | 'done' | 'paid' | 'cancelled'

export type Lead = {
  id: string
  created_at: string
  name: string | null
  phone: string | null
  source: string | null
  car: string | null
  city: string | null
  service_interest: string | null
  status: LeadStatus
  next_followup: string | null
  notes: string | null
  customer_id: string | null
}

export type Customer = {
  id: string
  created_at: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
  notes: string | null
}

export type Car = {
  id: string
  customer_id: string | null
  make_model: string | null
  plate: string | null
  color: string | null
  year: number | null
  notes: string | null
}

export type Job = {
  id: string
  created_at: string
  customer_id: string | null
  car_id: string | null
  service: string | null
  price: number | null
  vat_included: boolean
  job_date: string | null
  status: JobStatus
  photos_url: string | null
  notes: string | null
}

export type Coating = {
  id: string
  car_id: string | null
  job_id: string | null
  product: string | null
  applied_date: string | null
  warranty_months: number
  booster_interval_days: number
  last_booster_date: string | null
  notes: string | null
}

export type B2BAccount = {
  id: string
  name: string | null
  contact_name: string | null
  phone: string | null
  contract_type: string | null
  monthly_value: number | null
  term_start: string | null
  renewal_date: string | null
  status: string
  notes: string | null
}

export type Task = {
  id: string
  created_at: string
  title: string | null
  due_date: string | null
  done: boolean
  lead_id: string | null
  customer_id: string | null
  notes: string | null
}

export type CoatingWithCar = Coating & {
  car: (Car & { customer: Customer | null }) | null
}
