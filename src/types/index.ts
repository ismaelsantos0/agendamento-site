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
}

export interface ClinicSettings {
  id: string
  appointment_duration_minutes: number
}
