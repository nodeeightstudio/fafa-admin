export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'university' | 'ngo' | 'youth_program' | 'other';
  logo_url: string | null;
  invite_code: string;
  subscription_status: 'active' | 'trial' | 'inactive' | 'expired';
  allow_global_posting: boolean;
  allow_global_resources: boolean;
  allow_global_counselors: boolean;
  created_at: string;
  updated_at: string;
}
