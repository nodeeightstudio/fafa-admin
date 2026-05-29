import { supabase } from '@/lib/supabase'
import { Institution } from '@/types/institution'

export async function getInstitutions() {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Institution[]
}

export async function createInstitution(institution: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('institutions')
    .insert(institution)
    .select()
    .single()

  if (error) throw error
  return data as Institution
}

export async function approveInstitution(id: string) {
  const { data, error } = await supabase.rpc('approve_institution', {
    p_institution_id: id,
  })

  if (error) throw error
  return data
}

export async function deleteInstitution(id: string) {
  const { error } = await supabase
    .from('institutions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
