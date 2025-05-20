export interface TherapistProfile {
  id: string;
  specialization: string[];
  qualifications: string[];
  consultation_rates: number;
  availability: Record<string, any>;
  bio: string;
  verified: boolean;
  license_number?: string;
  education?: string[];
  experience_years?: number;
  languages?: string[];
  profile_picture?: string;
  profile_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  meeting_link?: string;
  payment_status: string;
  payment_amount?: number;
  read_at?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface AvailabilityException {
  id: string;
  therapist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TherapistReview {
  id: string;
  therapist_id: string;
  client_id: string;
  appointment_id?: string;
  rating: number;
  review_text?: string;
  is_anonymous: boolean;
  created_at: string;
  client?: {
    full_name?: string;
  };
}
