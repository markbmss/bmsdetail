import { supabase } from './supabaseClient'
import type { Lead, LeadStatus } from './types'

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Lead[]
}

export type LeadInput = {
  name: string
  phone: string
  source: string
  car: string
  city: string
  service_interest: string
  status: LeadStatus
  next_followup: string
  notes: string
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: input.name || null,
      phone: input.phone || null,
      source: input.source || null,
      car: input.car || null,
      city: input.city || null,
      service_interest: input.service_interest || null,
      status: input.status,
      next_followup: input.next_followup || null,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({
      name: input.name || null,
      phone: input.phone || null,
      source: input.source || null,
      car: input.car || null,
      city: input.city || null,
      service_interest: input.service_interest || null,
      status: input.status,
      next_followup: input.next_followup || null,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

export type ConvertInput = {
  customerName: string
  customerPhone: string
  customerCity: string
  carMakeModel: string
  createJob: boolean
  jobService: string
  jobPrice: string
  jobDate: string
}

// Creates a customer + car from a lead, links the lead to the new customer,
// and optionally creates a first job. Sequential inserts (no server-side
// transaction) — acceptable at this scale, but a partial failure here would
// need manual cleanup in Supabase.
export async function convertLead(lead: Lead, input: ConvertInput) {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      name: input.customerName || lead.name || 'Unnamed customer',
      phone: input.customerPhone || lead.phone || null,
      city: input.customerCity || lead.city || null,
    })
    .select()
    .single()
  if (customerError) throw customerError

  const { data: car, error: carError } = await supabase
    .from('cars')
    .insert({
      customer_id: customer.id,
      make_model: input.carMakeModel || lead.car || null,
    })
    .select()
    .single()
  if (carError) throw carError

  if (input.createJob) {
    const { error: jobError } = await supabase.from('jobs').insert({
      customer_id: customer.id,
      car_id: car.id,
      service: input.jobService || lead.service_interest || null,
      price: input.jobPrice ? Number(input.jobPrice) : null,
      job_date: input.jobDate || null,
      status: 'scheduled',
    })
    if (jobError) throw jobError
  }

  const { error: leadError } = await supabase
    .from('leads')
    .update({ customer_id: customer.id })
    .eq('id', lead.id)
  if (leadError) throw leadError

  return { customer, car }
}
