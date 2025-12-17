export type CounsellorStatus = 'pending' | 'active' | 'inactive' | 'suspended'

export interface Counsellor {
  id: string
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  avatar_url: string | null
  specialties: string[]
  experience: string | null
  qualifications: string[]
  languages: string[]
  is_online: boolean
  is_active: boolean
  is_verified: boolean
  status: CounsellorStatus
  average_rating: number
  total_reviews: number
  total_sessions: number
  created_at: string
  updated_at: string
  last_active_at: string | null
}

export interface CounsellorAvailability {
  id: string
  counsellor_id: string
  day_of_week: number // 0-6 (Sunday-Saturday)
  start_time: string // HH:MM format
  end_time: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CounsellorFormData {
  name: string
  email?: string
  phone?: string
  bio?: string
  avatar_url?: string
  specialties: string[]
  experience?: string
  qualifications: string[]
  languages: string[]
  is_active: boolean
  is_verified: boolean
  status: CounsellorStatus
}

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
}

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

export const SPECIALTIES = [
  'Psychologist',
  'Therapist',
  'Anxiety',
  'Depression',
  'Trauma',
  'PTSD',
  'Relationships',
  'Family',
  'Addiction',
  'Grief',
  'Stress Management'
] as const
