import { NextResponse } from 'next/server'

import { isSuperAdminEmail } from '@/lib/admin-allowlist'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const redirectPath = next?.startsWith('/') ? next : '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin))
  }

  if (isSuperAdminEmail(user.email)) {
    await supabase.rpc('ensure_super_admin_access')
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=not_admin', requestUrl.origin))
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
