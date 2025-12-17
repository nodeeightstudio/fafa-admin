'use server'

import { createClient } from '@/lib/supabase-server'
import { CounsellorAvailability } from '@/types/counsellor'

export async function getAvailability(counsellorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('counsellor_availability')
    .select('*')
    .eq('counsellor_id', counsellorId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as CounsellorAvailability[]
}

export async function addAvailabilitySlot(
  counsellorId: string,
  slot: {
    day_of_week: number
    start_time: string
    end_time: string
    timezone?: string
  }
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('counsellor_availability')
    .insert({
      counsellor_id: counsellorId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: slot.timezone || 'Africa/Accra',
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CounsellorAvailability
}

export async function deleteAvailabilitySlot(slotId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('counsellor_availability')
    .delete()
    .eq('id', slotId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
