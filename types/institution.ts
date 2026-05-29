export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'university' | 'ngo' | 'youth_program' | 'other';
  logo_url: string | null;
  invite_code: string;
  subscription_status: 'pending' | 'active' | 'trial' | 'inactive' | 'expired';
  allow_global_posting: boolean;
  allow_global_resources: boolean;
  allow_global_counselors: boolean;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  member_count_estimate?: number | null;
  onboarding_notes?: string | null;
  submitted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
}
