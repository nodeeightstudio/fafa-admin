# FAFA Admin Dashboard

Admin dashboard for managing counsellors, resources, and content moderation for the FAFA mobile app.

## Tech Stack
- **Frontend**: Next.js 14+ with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Forms**: React Hook Form + Zod validation

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Database Schema
The main database schema is already set up in your Supabase project. For admin functionality, run the SQL in `admin-schema.sql` in your Supabase SQL editor to add admin tables and policies.

### 4. Admin Setup
After running the admin schema, manually insert admin users into the `admins` table:

```sql
-- Replace with actual admin user IDs from auth.users
INSERT INTO admins (id, email, role) VALUES
('admin-user-uuid-here', 'admin@example.com', 'admin');
```

To get the user ID, you can:
1. Have the admin user sign up/login to the mobile app first
2. Check the `auth.users` table in Supabase for their UUID
3. Insert that UUID into the `admins` table

### 5. Authentication Setup
1. In Supabase Dashboard, go to Authentication > Settings
2. Configure your site URL and redirect URLs
3. Admin users need to be in both `auth.users` and `admins` tables

### 5. Run the Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `app/` - Next.js app router pages
- `components/` - Reusable UI components
- `lib/` - Utility functions and Supabase client
- `database-schema.sql` - Database schema

## Features Implemented
- ✅ Basic authentication setup with admin role checking
- ✅ Protected dashboard routes
- ✅ Supabase integration
- ✅ Modern sidebar navigation layout
- ✅ Counsellor management (CRUD operations)
- 🔄 Resource management (next phase)
- 🔄 Content moderation (next phase)

## Current Status

### Phase 1: Project Setup & Foundation ✅
- Next.js 14+ with App Router
- shadcn/ui + Tailwind CSS
- Supabase client setup
- Admin authentication
- Sidebar navigation layout

### Phase 2: Counsellor Management ✅
- List all counsellors with status indicators
- Add new counsellor form
- Basic counsellor profile fields (name, specialty, experience, bio, online status)
- Sidebar navigation with breadcrumbs

### Next Steps
- Complete resource management CRUD
- Implement content moderation dashboard
- Add file upload functionality
- Deploy to production
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
