import { createBrowserClient } from "@supabase/ssr";

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

export const getAdminRecord = async (): Promise<AdminUser | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as AdminUser;
};
