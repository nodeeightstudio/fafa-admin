import { createBrowserClient } from "@supabase/ssr";
import { isSuperAdminEmail } from "@/lib/admin-allowlist";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Function to check if current user is an admin
export const isUserAdmin = async (): Promise<boolean> => {
  const record = await getAdminRecord();
  return !!record;
};

export const isSuperAdmin = async (): Promise<boolean> => {
  const record = await getAdminRecord();
  return record?.role === "admin";
};

export const isInstitutionAdmin = async (): Promise<boolean> => {
  const record = await getAdminRecord();
  return record?.role === "institution_admin" && !!record.institution_id;
};

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator' | 'institution_admin';
  institution_id?: string | null;
}

export const ensureSuperAdminAccess = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isSuperAdminEmail(user?.email)) return false;

  const { data, error } = await supabase.rpc("ensure_super_admin_access");
  if (error) {
    console.error("Failed to ensure super admin access:", error);
    return false;
  }

  return data === true;
};

export const getAdminRecord = async (): Promise<AdminUser | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (isSuperAdminEmail(user.email)) {
    await ensureSuperAdminAccess();
  }

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as AdminUser;
};
