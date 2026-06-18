import { useState, useEffect } from 'react'
import { Calendar, LogOut, CheckCircle, XCircle, UserPlus, Clock, Settings } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import LoginPage from './LoginPage'
import { api } from '../api/client'
import { useAppointments, useProfessionals, useCreateProfessional, useCreateAvailabilityRule, useSettings, useUpdateSettings } from '../hooks/useAppointments'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { data: appointments = [], refetch } = useAppointments()
  const { data: professionals = [] } = useProfessionals()
  const createProf = useCreateProfessional()
  const createRule = useCreateAvailabilityRule()

  // Estados dos novos formulários
  const [showProfForm, setShowProfForm] = useState(false)
  const [newProfName, setNewProfName] = useState('')
  
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleProfId, setRuleProfId] = useState('')
  const [ruleDay, setRuleDay] = useState('1')
  const [ruleStart, setRuleStart] = useState('09:00')
  const [ruleEnd, setRuleEnd] = useState('18:00')

  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState('60')

  // Atualiza input quando carregar settings do backend
  useEffect(() => {
    if (settings) {
      setDurationMinutes(settings.appointment_duration_minutes.toString())
    }
  }, [settings])

  useEffect(() => {
    const token = localStorage.getItem('@agendamentos:token')
    if (token) setIsAuthenticated(true)
  }, [])

  if (!isAuthenticated) return <LoginPage onLogin={() => setIsAuthenticated(true)} />

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      toast.success('Status atualizado!')
      refetch()
    } catch {
      toast.error('Erro ao atualizar.')
    }
  }

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfName.trim()) return
    try {
      await createProf.mutateAsync({ name: newProfName })
      toast.success('Profissional cadastrado!')
      setNewProfName('')
      setShowProfForm(false)
    } catch {
      toast.error('Erro ao cadastrar profissional.')
    }
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleProfId) {
      toast.error('Selecione o profissional.')
      return
    }
    try {
      await createRule.mutateAsync({
        professional_id: ruleProfId,
        day_of_week: parseInt(ruleDay),
        start_time: ruleStart + ':00',
        end_time: ruleEnd + ':00'
      })
      toast.success('Horário salvo!')
      setShowRuleForm(false)
    } catch {
      toast.error('Erro ao salvar horário.')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(durationMinutes)
    if (isNaN(minutes) || minutes < 5) {
      toast.error('Duração inválida.')
      return
    }
    try {
      await updateSettings.mutateAsync({ appointment_duration_minutes: minutes })
      toast.success('Configurações salvas!')
      setShowSettingsForm(false)
    } catch {
      toast.error('Erro ao salvar configurações.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('@agendamentos:token')
    setIsAuthenticated(false)
  }

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white pt-12 pb-6 px-6 rounded-b-[2rem] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold">Gestão</h1>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/10 rounded-lg">
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </header>

      <main className="px-5 py-6 space-y-6">
        
        {/* Sessão: Cadastro Rápido */}
        <section className="flex flex-wrap gap-2">
          <button onClick={() => { setShowProfForm(!showProfForm); setShowRuleForm(false); setShowSettingsForm(false); }} className="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-primary font-medium text-sm active:scale-95 transition-all">
            <UserPlus className="w-6 h-6 mb-2" />
            Novo Especialista
          </button>
          <button onClick={() => { setShowRuleForm(!showRuleForm); setShowProfForm(false); setShowSettingsForm(false); }} className="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-secondary-dark font-medium text-sm active:scale-95 transition-all">
            <Clock className="w-6 h-6 mb-2 text-secondary-DEFAULT" />
            Adicionar Horário
          </button>
          <button onClick={() => { setShowSettingsForm(!showSettingsForm); setShowProfForm(false); setShowRuleForm(false); }} className="flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-700 font-medium text-sm active:scale-95 transition-all">
            <Settings className="w-6 h-6 mb-2 text-gray-500" />
            Configurações
          </button>
        </section>

        {/* Form: Especialista */}
        {showProfForm && (
          <form onSubmit={handleAddProfessional} className="card animate-fade-in space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Cadastrar Profissional</h3>
            <input 
              placeholder="Ex: Dr. João Silva" 
              className="input-field" 
              value={newProfName} 
              onChange={e => setNewProfName(e.target.value)} 
            />
            <button disabled={createProf.isPending} type="submit" className="btn-primary py-2 text-xs">
              {createProf.isPending ? 'Salvando...' : 'Salvar Especialista'}
            </button>
          </form>
        )}

        {/* Form: Horários */}
        {showRuleForm && (
          <form onSubmit={handleAddRule} className="card animate-fade-in space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Adicionar Dia de Trabalho</h3>
            <select className="input-field py-2" value={ruleProfId} onChange={e => setRuleProfId(e.target.value)}>
              <option value="">Selecione o profissional...</option>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="input-field py-2" value={ruleDay} onChange={e => setRuleDay(e.target.value)}>
              {diasSemana.map((dia, index) => <option key={index} value={index}>{dia}</option>)}
            </select>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Início</label>
                <input type="time" className="input-field py-2" value={ruleStart} onChange={e => setRuleStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Fim</label>
                <input type="time" className="input-field py-2" value={ruleEnd} onChange={e => setRuleEnd(e.target.value)} />
              </div>
            </div>
            <button disabled={createRule.isPending} type="submit" className="btn-primary py-2 text-xs mt-2">
              {createRule.isPending ? 'Salvando...' : 'Salvar Regra'}
            </button>
          </form>
        )}

        {/* Form: Configurações */}
        {showSettingsForm && (
          <form onSubmit={handleSaveSettings} className="card animate-fade-in space-y-3 border border-gray-200 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              Configurações Gerais
            </h3>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Duração de cada Consulta (em minutos)</label>
              <select className="input-field py-2" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)}>
                <option value="15">15 Minutos</option>
                <option value="20">20 Minutos</option>
                <option value="30">30 Minutos</option>
                <option value="45">45 Minutos</option>
                <option value="60">1 Hora (60 min)</option>
                <option value="90">1 Hora e meia (90 min)</option>
                <option value="120">2 Horas (120 min)</option>
              </select>
            </div>
            <button disabled={updateSettings.isPending} type="submit" className="btn-primary bg-gray-800 hover:bg-gray-900 py-2 text-xs mt-2">
              {updateSettings.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </form>
        )}

        <div className="w-full h-[1px] bg-gray-200 my-4" />

        {/* Sessão: Próximos Agendamentos */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Próximos Agendamentos</h2>
          
          {appointments.length === 0 && (
            <p className="text-center text-gray-400 py-10">Nenhum agendamento encontrado.</p>
          )}

          {appointments.map(appt => (
            <div key={appt.id} className="card border-l-4 border-l-primary flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{appt.customer_name}</h3>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">com {appt.professional_name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {appt.status}
                </span>
              </div>
              
              <div className="text-sm font-medium text-primary bg-primary/5 px-3 py-2 rounded-lg inline-block w-fit">
                {format(parseISO(appt.start_time), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
              </div>

              {appt.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1">
                  <button onClick={() => handleStatusChange(appt.id, 'confirmed')} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold active:scale-95 transition-all">
                    <CheckCircle className="w-4 h-4"/> Confirmar
                  </button>
                  <button onClick={() => handleStatusChange(appt.id, 'cancelled')} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold active:scale-95 transition-all">
                    <XCircle className="w-4 h-4"/> Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
