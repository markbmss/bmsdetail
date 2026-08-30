import { supabase } from './supabaseClient'
import type { Customer, Car, Coating, Job } from './types'

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true })
  if (error) throw error
  return data as Customer[]
}

export type CustomerInput = { name: string; phone: string; email: string; city: string; notes: string }

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      city: input.city || null,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      city: input.city || null,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export type CustomerDetail = {
  customer: Customer
  cars: Car[]
  coatings: Coating[]
  jobs: Job[]
}

export async function fetchCustomerDetail(id: string): Promise<CustomerDetail> {
  const [customerRes, carsRes, jobsRes] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('cars').select('*').eq('customer_id', id).order('make_model', { ascending: true }),
    supabase.from('jobs').select('*').eq('customer_id', id).order('job_date', { ascending: false }),
  ])
  if (customerRes.error) throw customerRes.error
  if (carsRes.error) throw carsRes.error
  if (jobsRes.error) throw jobsRes.error

  const cars = carsRes.data as Car[]
  const carIds = cars.map((c) => c.id)
  let coatings: Coating[] = []
  if (carIds.length > 0) {
    const { data, error } = await supabase.from('coatings').select('*').in('car_id', carIds)
    if (error) throw error
    coatings = data as Coating[]
  }

  return { customer: customerRes.data as Customer, cars, coatings, jobs: jobsRes.data as Job[] }
}

export type CarInput = { make_model: string; plate: string; color: string; year: string; notes: string }

export async function createCar(customerId: string, input: CarInput): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .insert({
      customer_id: customerId,
      make_model: input.make_model || null,
      plate: input.plate || null,
      color: input.color || null,
      year: input.year ? Number(input.year) : null,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Car
}

export async function updateCar(id: string, input: CarInput): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .update({
      make_model: input.make_model || null,
      plate: input.plate || null,
      color: input.color || null,
      year: input.year ? Number(input.year) : null,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Car
}

export type CoatingInput = {
  product: string
  applied_date: string
  warranty_months: string
  booster_interval_days: string
  last_booster_date: string
  notes: string
}

export async function createCoating(carId: string, input: CoatingInput): Promise<Coating> {
  const { data, error } = await supabase
    .from('coatings')
    .insert({
      car_id: carId,
      product: input.product || null,
      applied_date: input.applied_date || null,
      warranty_months: input.warranty_months ? Number(input.warranty_months) : 36,
      booster_interval_days: input.booster_interval_days ? Number(input.booster_interval_days) : 90,
      last_booster_date: input.last_booster_date || null,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Coating
}

export async function updateCoating(id: string, input: CoatingInput): Promise<Coating> {
  const { data, error } = await supabase
    .from('coatings')
    .update({
      product: input.product || null,
      applied_date: input.applied_date || null,
      warranty_months: input.warranty_months ? Number(input.warranty_months) : 36,
      booster_interval_days: input.booster_interval_days ? Number(input.booster_interval_days) : 90,
      last_booster_date: input.last_booster_date || null,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Coating
}
