'use server'

import { createClient } from '@/lib/supabase-server'
import { BookingWithDetails } from '@/types/booking'

export async function getBookings(filters?: {
  status?: string
  counsellorId?: string
  dateFrom?: string
  dateTo?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('bookings')
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(id, email, full_name),
      counsellor:counsellors!bookings_counsellor_id_fkey(id, name, specialties, avatar_url)
    `)
    .order('scheduled_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.counsellorId) {
    query = query.eq('counsellor_id', filters.counsellorId)
  }

  if (filters?.dateFrom) {
    query = query.gte('scheduled_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('scheduled_at', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data as BookingWithDetails[]
}

export async function getBooking(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(id, email, full_name),
      counsellor:counsellors!bookings_counsellor_id_fkey(id, name, specialties, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error('Booking not found')
  }

  return data as BookingWithDetails
}

export async function updateBookingStatus(
  bookingId: string,
  status: string,
  cancellationReason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancelled_by = user.id
    updateData.cancellation_reason = cancellationReason || 'Cancelled by admin'
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(id, email, full_name),
      counsellor:counsellors!bookings_counsellor_id_fkey(id, name, specialties, avatar_url)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as BookingWithDetails
}
