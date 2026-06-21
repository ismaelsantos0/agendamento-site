export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Professional {
  id: string
  name: string
  is_active: boolean
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
}

export interface CreateAppointmentPayload {
  professional_id: string
  customer_name: string
  customer_phone: string
  start_time: string
  notes?: string
  otp_code: string
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

export interface ClinicSettings {
  id: string;
  clinic_name: string | null;
  address: string | null;
  opening_hours: string | null;
  appointment_duration_minutes: number;
  msg_created: string | null;
  msg_confirmation: string | null;
  msg_feedback_confirmed: string | null;
  msg_feedback_cancelled: string | null;
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
