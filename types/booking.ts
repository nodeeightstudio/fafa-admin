export type BookingStatus = 'awaiting_payment' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'expired'
export type SessionType = 'chat' | 'online' | 'video'
export type BookingDuration = 15 | 30 | 45 | 60

export interface Booking {
  id: string
  user_id: string
  counsellor_id: string
  session_type: SessionType
  duration: BookingDuration
  message: string | null
  scheduled_at: string
  scheduled_end_at: string
  timezone: string
  status: BookingStatus
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  started_at: string | null
  ended_at: string | null
  session_notes: string | null
  created_at: string
  updated_at: string
  amount_pesewas: number | null
  currency: string | null
  payment_status: PaymentStatus | null
  payment_reference: string | null
  paid_at: string | null
}

export interface BookingWithDetails extends Booking {
  user: {
    id: string
    email: string
    full_name: string | null
  }
  counsellor: {
    id: string
    name: string
    specialties: string[]
    avatar_url: string | null
  }
}

export interface Review {
  id: string
  booking_id: string
  user_id: string
  counsellor_id: string
  rating: number
  comment: string | null
  professionalism_rating: number | null
  communication_rating: number | null
  helpfulness_rating: number | null
  is_visible: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
}
