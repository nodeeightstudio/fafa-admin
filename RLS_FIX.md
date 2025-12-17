# RLS Authentication Fix - Complete ✅

## Problem
Server actions were getting "row violates row-level security policy" errors because they weren't passing the user's authentication session to Supabase.

## Root Cause
- Server actions were using the client-side Supabase instance
- Client-side instance doesn't have access to server-side cookies where the session is stored
- RLS policies check `auth.uid()` which was null without the session

## Solution
Created a server-side Supabase client that reads the user session from cookies:

### Files Created/Modified
1. **`/lib/supabase-server.ts`** - New server-side client factory
   - Uses `@supabase/ssr` package
   - Reads session from Next.js cookies
   - Returns authenticated Supabase client

2. **Updated all server actions** to use `await createClient()`:
   - `/lib/actions/counsellors.ts` - 5 functions updated
   - `/lib/actions/availability.ts` - 3 functions updated
   - `/lib/actions/bookings.ts` - 3 functions updated

## How It Works Now
```typescript
// Server Action
export async function createCounsellor(formData) {
  const supabase = await createClient() // ← Gets user session from cookies
  
  const { data, error } = await supabase
    .from('counsellors')
    .insert(formData) // ← RLS policy sees auth.uid() and allows insert
    
  return data
}
```

## Testing
Try creating a counsellor again - it should work now! The RLS policy will:
1. See the authenticated user's ID via `auth.uid()`
2. Check if that ID exists in the `admins` table
3. Allow the insert if the user is an admin

## Dependencies Added
- `@supabase/ssr` - Official Supabase package for server-side rendering
