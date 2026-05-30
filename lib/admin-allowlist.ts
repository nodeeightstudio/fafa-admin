export const SUPER_ADMIN_EMAILS = [
  'delight@nodeeight.org',
  'xorse@nodeeight.org',
  'brian@nodeeight.org',
  'ohenesetwumasi@gmail.com',
] as const

export function isSuperAdminEmail(email?: string | null) {
  return !!email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number])
}
