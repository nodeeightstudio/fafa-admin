import { createClient } from '@supabase/supabase-js'

// Create a single admin client instance
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper to get authenticated user from Supabase
export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Helper to check if user is admin
export async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('id', userId)
    .single()
  
  return !!data
}
