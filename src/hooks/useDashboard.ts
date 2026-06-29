import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface DashboardMetrics {
  total_current_month: number;
  total_last_month: number;
  by_status: Record<string, number>;
  by_professional: { name: string; total: number }[];
  by_service: { name: string; total: number }[];
  by_day: { date: string; total: number }[];
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
};

export function useDashboardMetrics(professionalId?: string | null) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, professionalId],
    queryFn: async () => {
      const params = professionalId ? { professional_id: professionalId } : {};
      const { data } = await api.get<DashboardMetrics>('/dashboard/metrics', { params });
      return data;
    },
    // Atualizar a cada 5 minutos
    staleTime: 5 * 60 * 1000,
  });
}
