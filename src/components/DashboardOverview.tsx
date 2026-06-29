import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { CalendarDays, CheckCircle2, XCircle, Users } from 'lucide-react';

interface DashboardOverviewProps {
  professionalId?: string | null;
  role: string;
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ professionalId, role }) => {
  const { data: metrics, isLoading, error } = useDashboardMetrics(professionalId);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando métricas...</div>;
  }

  if (error || !metrics) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar métricas.</div>;
  }

  const { total_current_month, total_last_month, by_status, by_professional, by_service, by_day } = metrics;
  
  const completed = by_status['completed'] || 0;
  const cancelled = by_status['cancelled'] || 0;
  
  const growth = total_last_month > 0 
    ? Math.round(((total_current_month - total_last_month) / total_last_month) * 100) 
    : 100;

  const pieData = Object.keys(by_status).map(key => ({
    name: key === 'completed' ? 'Concluídos' : key === 'cancelled' ? 'Cancelados' : key === 'confirmed' ? 'Confirmados' : key === 'pending_reschedule' ? 'Reagendamento' : 'Pendentes',
    value: by_status[key]
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total no Mês</p>
            <h3 className="text-2xl font-bold text-gray-800">{total_current_month}</h3>
            <p className={`text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth}% vs mês passado
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Concluídos</p>
            <h3 className="text-2xl font-bold text-gray-800">{completed}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Cancelados</p>
            <h3 className="text-2xl font-bold text-gray-800">{cancelled}</h3>
          </div>
        </div>

        {role !== 'profissional' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Equipe</p>
              <h3 className="text-2xl font-bold text-gray-800">{by_professional.length} Profiss.</h3>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-800 mb-4">Volume de Agendamentos (30 dias)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={by_day}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 'bold', color: '#333'}}
                />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 6}} name="Agendamentos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-800 mb-4">Status dos Agendamentos</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {role !== 'profissional' && by_professional.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">Atendimentos por Profissional</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={by_professional} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#555', fontWeight: 500}} width={100} />
                  <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} name="Atendimentos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {by_service.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4">Serviços Mais Procurados</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={by_service} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#555', fontWeight: 500}} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} name="Realizados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
