export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Professional {
  id: string
  name: string
  profession?: string
  contact_number?: string
  notify_new: boolean
  notify_cancelled: boolean
  notify_rescheduled: boolean
  notify_upcoming: boolean
  is_active: boolean
  slug?: string
  has_custom_link: boolean
}

export interface User {
  id: string
  username: string
  role: 'master' | 'clinica' | 'profissional'
  is_active: boolean
  professional_id?: string
}

export interface AvailabilityRule {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Appointment {
  id: string
  professional_id: string
  professional_name?: string
  customer_name: string
  customer_phone: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes?: string
  service_name?: string
  clinical_notes?: string
}

export interface CreateAppointmentPayload {
  professional_id: string
  customer_name: string
  customer_phone: string
  start_time: string
  notes?: string
  otp_code?: string
  service_name?: string
}

export interface AddressInfo {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  mapsLink: string;
}

export interface DailySchedule {
  isOpen: boolean;
  start: string;
  end: string;
}

export type WeeklySchedule = Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', DailySchedule>;

export interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price?: string;
  professional_ids?: string[];
}

export interface ClinicSettings {
  id: string;
  clinic_name: string | null;
  address: string | null;
  opening_hours: string | null;
  appointment_duration_minutes: number;
  msg_created: string | null;
  msg_confirmation: string | null;
  msg_feedback_confirmed: string | null;
  msg_feedback_cancelled?: string
  services?: string
  allow_custom_links: boolean
  reminder_hours_before?: number | null
  reminder_message?: string | null
  primary_color?: string | null
  banner_image_url?: string | null
  social_instagram?: string | null
  social_whatsapp?: string | null
}

export interface Blockout {
  id: string
  professional_id: string
  date: string
  start_time: string
  end_time: string
}

export interface CreateBlockoutPayload {
  professional_id: string
  date: string
  start_time: string
  end_time: string
}

export interface Patient {
  name: string;
  phone: string;
  last_visit: string | null;
}
