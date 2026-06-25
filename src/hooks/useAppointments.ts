import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Professional, AvailabilityRule, Appointment, CreateAppointmentPayload, ClinicSettings, Blockout, CreateBlockoutPayload, ServiceItem } from '../types'

export const queryKeys = {
  professionals: ['professionals'] as const,
  availability: (professionalId?: string) => professionalId ? ['availability', professionalId] as const : ['availability'] as const,
  appointments: (professionalId?: string, startDate?: string, endDate?: string, status?: string) => {
    return ['appointments', professionalId, startDate, endDate, status].filter(Boolean) as string[]
  },
  settings: ['settings'] as const,
  blockouts: (professionalId?: string) => professionalId ? ['blockouts', professionalId] as const : ['blockouts'] as const,
  services: ['services'] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────

export function useProfessionals() {
  return useQuery({
    queryKey: queryKeys.professionals,
    queryFn: async () => {
      const { data } = await api.get<Professional[]>('/professionals')
      return data
    },
  })
}

export function useProfessionalBySlug(slug?: string) {
  return useQuery({
    queryKey: ['professional', slug],
    queryFn: async () => {
      if (!slug) return null
      const { data } = await api.get<Professional>(`/professionals/slug/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function useAvailability(professionalId?: string) {
  return useQuery({
    queryKey: queryKeys.availability(professionalId),
    queryFn: async () => {
      const { data } = await api.get<AvailabilityRule[]>('/availability', {
        params: { professional_id: professionalId }
      })
      return data
    },
    enabled: !!professionalId,
  })
}

export function useAppointments(professionalId?: string, startDate?: string, endDate?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.appointments(professionalId, startDate, endDate, status),
    queryFn: async () => {
      const params: any = {}
      if (professionalId) params.professional_id = professionalId
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (status) params.status = status
      
      const { data } = await api.get<Appointment[]>('/appointments', { params })
      return data
    },
  })
}

export function usePatientHistory(phone?: string, name?: string) {
  return useQuery({
    queryKey: ['patientHistory', phone, name],
    queryFn: async () => {
      const { data } = await api.get<Appointment[]>('/appointments/history', {
        params: { phone, name }
      })
      return data
    },
    enabled: !!phone && !!name,
  })
}

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data } = await api.get<import('../types').Patient[]>('/appointments/patients')
      return data
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const { data } = await api.get<ClinicSettings>('/settings')
      return data
    },
  })
}



export function useServices() {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: async () => {
      const { data } = await api.get<ServiceItem[]>('/services')
      return data
    },
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────


export function useWhatsappLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{success: boolean}>('/whatsapp/logout')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status })
    },
  })
}

export function useResetWhatsapp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{success: boolean, message: string}>('/whatsapp/reset')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status })
    },
  })
}

export function useResetSystem() {
  return useMutation({
    mutationFn: async (payload: {
      reset_appointments: boolean
      reset_professionals: boolean
      reset_services: boolean
      reset_users: boolean
      reset_settings: boolean
    }) => {
      const { data } = await api.post<{status: string, message: string}>('/settings/reset', payload)
      return data
    }
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ServiceItem, 'id'>) => {
      const { data } = await api.post<ServiceItem>('/services', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: ServiceItem) => {
      const { data } = await api.put<ServiceItem>(`/services/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
    },
  })
}

export function useSyncServices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (services: Partial<ServiceItem>[]) => {
      const { data } = await api.put<ServiceItem[]>('/services/sync', services)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services })
    },
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      const { data } = await api.post<Appointment>('/appointments', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() })
    },
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, start_time }: { id: string; start_time: string }) => {
      const { data } = await api.put<Appointment>(`/appointments/${id}/reschedule`, { start_time })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() })
    },
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, clinical_notes }: { id: string; clinical_notes: string }) => {
      const { data } = await api.put<Appointment>(`/appointments/${id}/complete`, { clinical_notes })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() })
    },
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (payload: { customer_phone: string; customer_name: string; professional_id: string }) => {
      const { data } = await api.post('/appointments/send-code', payload)
      return data
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
      const { data } = await api.put<Appointment>(`/appointments/${id}/status`, { status, notes })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() })
    },
  })
}

export function useCreateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Professional, 'id'>) => {
      const { data } = await api.post<Professional>('/professionals', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals })
    },
  })
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Professional> & { id: string }) => {
      const { data } = await api.put<Professional>(`/professionals/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals })
    },
  })
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/professionals/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.professionals })
    },
  })
}

export function useCreateAvailabilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<AvailabilityRule, 'id'>) => {
      const { data } = await api.post<AvailabilityRule>('/availability', payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability(variables.professional_id) })
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { 
      appointment_duration_minutes: number, 
      clinic_name?: string,
      address?: string,
      opening_hours?: string,
      msg_created?: string, 
      msg_confirmation?: string,
      msg_feedback_confirmed?: string,
      msg_feedback_cancelled?: string,
      services?: string,
      allow_custom_links?: boolean,
      reminder_hours_before?: number | null,
      reminder_message?: string,
      primary_color?: string,
      banner_image_url?: string,
      logo_url?: string,
      background_style?: string,
      social_instagram?: string,
      social_whatsapp?: string,
    }) => {
      const { data } = await api.put<ClinicSettings>('/settings', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}

// ─── Blockouts & Exclusão de Regras ──────────────────────────────────────

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/availability/${ruleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability() })
    },
  })
}

export function useBlockouts(professionalId?: string) {
  return useQuery({
    queryKey: queryKeys.blockouts(professionalId),
    queryFn: async () => {
      const { data } = await api.get<Blockout[]>('/blockouts', {
        params: { professional_id: professionalId }
      })
      return data
    },
    enabled: !!professionalId,
  })
}

export function useCreateBlockout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateBlockoutPayload) => {
      const { data } = await api.post<Blockout>('/blockouts', payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockouts(variables.professional_id) })
    },
  })
}

export function useDeleteBlockout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blockoutId: string) => {
      await api.delete(`/blockouts/${blockoutId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockouts() })
    },
  })
}

// ─── WhatsApp Management ──────────────────────────────────────────────────

export const whatsappKeys = {
  status: ['whatsapp', 'status'] as const,
}

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: whatsappKeys.status,
    queryFn: async () => {
      const { data } = await api.get<{status: string}>('/whatsapp/status')
      return data
    },
    refetchInterval: 5000, // Poll a cada 5 segundos
    enabled: !!localStorage.getItem('@agendamentos:token'),
  })
}

export function useWhatsAppQR() {
  return useMutation({
    mutationFn: async () => {
      try {
        const { data } = await api.get<{base64?: string, error?: string}>('/whatsapp/qr')
        if (data.error) throw new Error(data.error)
        return data.base64
      } catch (err: any) {
        if (err.response?.data?.detail) {
          throw new Error(err.response.data.detail)
        }
        throw err
      }
    }
  })
}

export function useTestWhatsApp() {
  return useMutation({
    mutationFn: async (payload: {telefone: string, texto: string}) => {
      const { data } = await api.post('/whatsapp/test', payload)
      return data
    }
  })
}

export function useTestConfirmationMessage() {
  return useMutation({
    mutationFn: async (payload: { telefone: string, msg_confirmation?: string }) => {
      const { data } = await api.post<{
        status: string
        preview: string
        appointment_id: string
        professional_name: string
        customer_name: string
      }>('/settings/test-confirmation', payload)
      return data
    }
  })
}

export function useAppointmentById(appointmentId: string | null, enabled = false) {
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const { data } = await api.get<Appointment>(`/appointments/${appointmentId}`)
      return data
    },
    enabled: enabled && !!appointmentId,
    refetchInterval: enabled && !!appointmentId ? 3000 : false,
  })
}
