import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Professional, AvailabilityRule, Appointment, CreateAppointmentPayload } from '../types'

export const queryKeys = {
  professionals: ['professionals'] as const,
  availability: ['availability'] as const,
  appointments: ['appointments'] as const,
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

export function useAvailability(professionalId?: string) {
  return useQuery({
    queryKey: [...queryKeys.availability, { professionalId }],
    queryFn: async () => {
      const { data } = await api.get<AvailabilityRule[]>('/availability', {
        params: { professional_id: professionalId }
      })
      return data
    },
    enabled: !!professionalId,
  })
}

export function useAppointments(professionalId?: string, date?: string) {
  return useQuery({
    queryKey: [...queryKeys.appointments, { professionalId, date }],
    queryFn: async () => {
      const params: any = {}
      if (professionalId) params.professional_id = professionalId
      if (date) params.date = date
      
      const { data } = await api.get<Appointment[]>('/appointments', { params })
      return data
    },
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      const { data } = await api.post<Appointment>('/appointments', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
    },
  })
}

export function useCreateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; is_active?: boolean }) => {
      const { data } = await api.post<Professional>('/professionals', payload)
      return data
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
      queryClient.invalidateQueries({ queryKey: [...queryKeys.availability, { professionalId: variables.professional_id }] })
    },
  })
}
