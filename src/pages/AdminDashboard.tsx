import { useState, useEffect } from 'react'
import { Calendar, LogOut, CheckCircle, XCircle, UserPlus, Clock, Settings, CalendarCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import LoginPage from './LoginPage'
import { api } from '../api/client'
import { 
  useAppointments, 
  useProfessionals, 
  useCreateProfessional, 
  useCreateAvailabilityRule, 
  useSettings, 
  useUpdateSettings,
  useDeleteAvailabilityRule,
  useBlockouts,
  useCreateBlockout,
  useDeleteBlockout,
  useAvailability,
  useUpdateAppointmentStatus
} from '../hooks/useAppointments'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { data: appointments = [], refetch } = useAppointments()
  const { data: professionals = [] } = useProfessionals()
  const createProf = useCreateProfessional()
  const createRule = useCreateAvailabilityRule()
  const deleteRule = useDeleteAvailabilityRule()
  const createBlockout = useCreateBlockout()
  const deleteBlockout = useDeleteBlockout()

  // Estados dos novos formulários
  const [showProfForm, setShowProfForm] = useState(false)
  const [newProfName, setNewProfName] = useState('')
  
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleProfId, setRuleProfId] = useState('')
  const [ruleDay, setRuleDay] = useState('1')
  const [ruleStart, setRuleStart] = useState('09:00')
  const [ruleEnd, setRuleEnd] = useState('18:00')

  const [blockoutDate, setBlockoutDate] = useState('')
  const [blockoutStart, setBlockoutStart] = useState('09:00')
  const [blockoutEnd, setBlockoutEnd] = useState('18:00')

  const { data: availabilityRules = [] } = useAvailability(ruleProfId)
  const { data: blockouts = [] } = useBlockouts(ruleProfId)

  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState('60')

  const [showAppointmentsTab, setShowAppointmentsTab] = useState(false)
  const [cancelModalApptId, setCancelModalApptId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const updateAppointmentStatus = useUpdateAppointmentStatus()

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
      await updateAppointmentStatus.mutateAsync({ id, status })
      toast.success('Agendamento confirmado!')
    } catch {
      toast.error('Erro ao confirmar agendamento.')
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelModalApptId) return
    if (!cancelReason.trim()) {
      toast.error('Informe o motivo do cancelamento.')
      return
    }
    try {
      await updateAppointmentStatus.mutateAsync({ id: cancelModalApptId, status: 'cancelled', notes: cancelReason })
      toast.success('Agendamento cancelado!')
      setCancelModalApptId(null)
      setCancelReason('')
    } catch {
      toast.error('Erro ao cancelar agendamento.')
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

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule.mutateAsync(ruleId)
      toast.success('Horário removido!')
    } catch {
      toast.error('Erro ao remover horário.')
    }
  }

  const handleAddBlockout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleProfId || !blockoutDate) {
      toast.error('Selecione o profissional e a data.')
      return
    }
    try {
      await createBlockout.mutateAsync({
        professional_id: ruleProfId,
        date: blockoutDate,
        start_time: blockoutStart + ':00',
        end_time: blockoutEnd + ':00'
      })
      toast.success('Bloqueio salvo!')
    } catch {
      toast.error('Erro ao salvar bloqueio.')
    }
  }

  const handleDeleteBlockout = async (blockoutId: string) => {
    try {
      await deleteBlockout.mutateAsync(blockoutId)
      toast.success('Bloqueio removido!')
    } catch {
      toast.error('Erro ao remover bloqueio.')
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
        
        {/* Sessão: Abas Principais */}
        <section className="flex flex-wrap gap-2">
          <button onClick={() => { setShowAppointmentsTab(!showAppointmentsTab); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showAppointmentsTab ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <CalendarCheck className={`w-6 h-6 mb-2 ${showAppointmentsTab ? 'text-primary' : 'text-gray-500'}`} />
            Agendamentos
          </button>
          <button onClick={() => { setShowProfForm(!showProfForm); setShowAppointmentsTab(false); setShowRuleForm(false); setShowSettingsForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showProfForm ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <UserPlus className={`w-6 h-6 mb-2 ${showProfForm ? 'text-primary' : 'text-gray-500'}`} />
            Especialista
          </button>
          <button onClick={() => { setShowRuleForm(!showRuleForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowSettingsForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showRuleForm ? 'bg-secondary-dark/10 border-secondary-dark text-secondary-dark' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <Clock className={`w-6 h-6 mb-2 ${showRuleForm ? 'text-secondary-dark' : 'text-gray-500'}`} />
            Horários
          </button>
          <button onClick={() => { setShowSettingsForm(!showSettingsForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showSettingsForm ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <Settings className={`w-6 h-6 mb-2 ${showSettingsForm ? 'text-white' : 'text-gray-500'}`} />
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
          <div className="card animate-fade-in space-y-6">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Gerenciar Horários e Pausas</h3>
              <select className="input-field py-2" value={ruleProfId} onChange={e => setRuleProfId(e.target.value)}>
                <option value="">Selecione o profissional...</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {ruleProfId && (
              <div className="space-y-6 animate-fade-in">
                {/* Regras Fixas */}
                <form onSubmit={handleAddRule} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">1. Adicionar Regra Semanal</h4>
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
                  <button disabled={createRule.isPending} type="submit" className="btn-primary py-2 text-xs w-full mt-2">
                    {createRule.isPending ? 'Salvando...' : 'Salvar Regra Fixo'}
                  </button>
                </form>
                
                {availabilityRules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-600 uppercase">Regras Fixas Atuais</h4>
                    <div className="grid gap-2">
                      {availabilityRules.map(r => (
                        <div key={r.id} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg text-sm shadow-sm">
                          <span className="font-medium text-gray-700">{diasSemana[r.day_of_week]} das {r.start_time.substring(0,5)} às {r.end_time.substring(0,5)}</span>
                          <button type="button" onClick={() => handleDeleteRule(r.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><XCircle className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full h-[1px] bg-gray-200" />

                {/* Exceções */}
                <form onSubmit={handleAddBlockout} className="space-y-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <h4 className="text-xs font-bold text-red-600 uppercase mb-2">2. Pausa / Bloqueio (Exceção)</h4>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Data Específica</label>
                    <input type="date" className="input-field py-2" value={blockoutDate} onChange={e => setBlockoutDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Início da Pausa</label>
                      <input type="time" className="input-field py-2" value={blockoutStart} onChange={e => setBlockoutStart(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Fim da Pausa</label>
                      <input type="time" className="input-field py-2" value={blockoutEnd} onChange={e => setBlockoutEnd(e.target.value)} />
                    </div>
                  </div>
                  <button disabled={createBlockout.isPending} type="submit" className="bg-red-600 text-white rounded-xl py-2 text-xs w-full font-bold hover:bg-red-700 transition-colors mt-2">
                    {createBlockout.isPending ? 'Bloqueando...' : 'Bloquear Horário'}
                  </button>
                </form>
                
                {blockouts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-600 uppercase">Bloqueios Atuais</h4>
                    <div className="grid gap-2">
                      {blockouts.map(b => (
                        <div key={b.id} className="flex justify-between items-center bg-white border border-red-200 p-2.5 rounded-lg text-sm shadow-sm">
                          <span className="font-medium text-red-700">{format(parseISO(b.date), 'dd/MM/yyyy')} das {b.start_time.substring(0,5)} às {b.end_time.substring(0,5)}</span>
                          <button type="button" onClick={() => handleDeleteBlockout(b.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><XCircle className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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

        {/* Aba de Agendamentos */}
        {showAppointmentsTab && (
          <section className="space-y-4 animate-fade-in">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              Gestão de Agendamentos
            </h2>
            
            {appointments.length === 0 && (
              <p className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">Nenhum agendamento encontrado.</p>
            )}

            <div className="grid gap-4">
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

                  {appt.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mt-1 whitespace-pre-wrap">
                      <span className="font-bold">Observações/Motivo:</span> {appt.notes}
                    </div>
                  )}

                  {appt.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1">
                      <button onClick={() => handleStatusChange(appt.id, 'confirmed')} disabled={updateAppointmentStatus.isPending} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-green-100">
                        <CheckCircle className="w-4 h-4"/> Confirmar
                      </button>
                      <button onClick={() => setCancelModalApptId(appt.id)} disabled={updateAppointmentStatus.isPending} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-red-100">
                        <XCircle className="w-4 h-4"/> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Modal de Cancelamento */}
      {cancelModalApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Cancelar Agendamento
            </h3>
            <p className="text-sm text-gray-600">
              Por favor, informe o motivo do cancelamento. Essa informação ficará salva no registro da consulta.
            </p>
            <textarea
              className="input-field min-h-[100px] resize-none"
              placeholder="Digite o motivo do cancelamento..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => { setCancelModalApptId(null); setCancelReason(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleCancelConfirm}
                disabled={!cancelReason.trim() || updateAppointmentStatus.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateAppointmentStatus.isPending ? 'Aguarde...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
