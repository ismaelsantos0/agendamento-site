import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { User } from '../types'

export const queryKeys = {
  users: ['users'],
  currentUser: ['current_user'],
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me')
      return data
    },
    retry: false
  })
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users')
      return data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<User> & { password?: string }) => {
      const { data } = await api.post<User>('/users', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<User> & { id: string; password?: string }) => {
      const { data } = await api.put<User>(`/users/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}
