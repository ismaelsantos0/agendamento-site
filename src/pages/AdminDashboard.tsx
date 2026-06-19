import { useState, useEffect } from 'react'
import { Calendar, LogOut, CheckCircle, XCircle, UserPlus, Clock, Settings, CalendarCheck, MessageCircle, RefreshCw, Send } from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import LoginPage from './LoginPage'
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
  useUpdateAppointmentStatus,
  useWhatsAppStatus,
  useWhatsAppQR,
  useTestWhatsApp,
  useTestConfirmationMessage,
  useAppointmentById
} from '../hooks/useAppointments'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('hoje')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProfessional, setFilterProfessional] = useState<string>('')
  
  let startDate: string | undefined = undefined
  let endDate: string | undefined = undefined
  const now = new Date()

  if (filterPeriod === 'hoje') {
    startDate = format(startOfDay(now), 'yyyy-MM-dd')
    endDate = format(endOfDay(now), 'yyyy-MM-dd')
  } else if (filterPeriod === 'semana') {
    startDate = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
    endDate = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
  } else if (filterPeriod === 'mes') {
    startDate = format(startOfMonth(now), 'yyyy-MM-dd')
    endDate = format(endOfMonth(now), 'yyyy-MM-dd')
  }

  const { data: appointments = [] } = useAppointments(
    filterProfessional || undefined, 
    startDate, 
    endDate, 
    filterStatus || undefined
  )
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

  // Estados do WhatsApp
  const [showWhatsAppTab, setShowWhatsAppTab] = useState(false)
  const { data: wpStatus, refetch: refetchWpStatus } = useWhatsAppStatus()
  const generateQR = useWhatsAppQR()
  const testWp = useTestWhatsApp()
  const testConfirmation = useTestConfirmationMessage()
  const [awaitingConfirmationReply, setAwaitingConfirmationReply] = useState(false)
  const [testConfirmationApptId, setTestConfirmationApptId] = useState<string | null>(null)
  const { data: testConfirmationAppt } = useAppointmentById(testConfirmationApptId, awaitingConfirmationReply)
  
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('Teste de disparo pelo painel!')
  const [testConfirmationPhone, setTestConfirmationPhone] = useState('')
  
  const [msgCreated, setMsgCreated] = useState('')
  const [msgConfirmation, setMsgConfirmation] = useState('')
  const [msgFeedbackConfirmed, setMsgFeedbackConfirmed] = useState('')
  const [msgFeedbackCancelled, setMsgFeedbackCancelled] = useState('')

  // Atualiza input quando carregar settings do backend
  useEffect(() => {
    if (settings) {
      setDurationMinutes(settings.appointment_duration_minutes.toString())
      setMsgCreated(settings.msg_created || '')
      setMsgConfirmation(settings.msg_confirmation || '')
      setMsgFeedbackConfirmed(settings.msg_feedback_confirmed || '')
      setMsgFeedbackCancelled(settings.msg_feedback_cancelled || '')
    }
  }, [settings])

  useEffect(() => {
    const token = localStorage.getItem('@agendamentos:token')
    if (token) setIsAuthenticated(true)
  }, [])

  useEffect(() => {
    if (!awaitingConfirmationReply || !testConfirmationAppt) return
    if (testConfirmationAppt.status === 'confirmed') {
      toast.success('Sistema recebeu sua resposta! Agendamento CONFIRMADO.')
      setAwaitingConfirmationReply(false)
    } else if (
      testConfirmationAppt.status === 'cancelled' &&
      testConfirmationAppt.notes?.includes('[WhatsApp]')
    ) {
      toast.success('Sistema recebeu sua resposta! Agendamento CANCELADO.')
      setAwaitingConfirmationReply(false)
    }
  }, [awaitingConfirmationReply, testConfirmationAppt])

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
      await updateSettings.mutateAsync({ 
        appointment_duration_minutes: minutes,
        msg_created: msgCreated.trim() || undefined,
        msg_confirmation: msgConfirmation.trim() || undefined,
        msg_feedback_confirmed: msgFeedbackConfirmed.trim() || undefined,
        msg_feedback_cancelled: msgFeedbackCancelled.trim() || undefined
      })
      toast.success('Configurações salvas!')
      setShowSettingsForm(false)
      setShowWhatsAppTab(false)
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
          <button onClick={() => { setShowAppointmentsTab(!showAppointmentsTab); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); setShowWhatsAppTab(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showAppointmentsTab ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <CalendarCheck className={`w-6 h-6 mb-2 ${showAppointmentsTab ? 'text-primary' : 'text-gray-500'}`} />
            Agendamentos
          </button>
          <button onClick={() => { setShowProfForm(!showProfForm); setShowAppointmentsTab(false); setShowRuleForm(false); setShowSettingsForm(false); setShowWhatsAppTab(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showProfForm ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <UserPlus className={`w-6 h-6 mb-2 ${showProfForm ? 'text-primary' : 'text-gray-500'}`} />
            Especialista
          </button>
          <button onClick={() => { setShowRuleForm(!showRuleForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowSettingsForm(false); setShowWhatsAppTab(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showRuleForm ? 'bg-secondary-dark/10 border-secondary-dark text-secondary-dark' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <Clock className={`w-6 h-6 mb-2 ${showRuleForm ? 'text-secondary-dark' : 'text-gray-500'}`} />
            Horários
          </button>
          <button onClick={() => { setShowWhatsAppTab(!showWhatsAppTab); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showWhatsAppTab ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <MessageCircle className={`w-6 h-6 mb-2 ${showWhatsAppTab ? 'text-green-600' : 'text-gray-500'}`} />
            WhatsApp
          </button>
          <button onClick={() => { setShowSettingsForm(!showSettingsForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); setShowWhatsAppTab(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showSettingsForm ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
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

        {/* Aba: WhatsApp */}
        {showWhatsAppTab && (
          <div className="space-y-6 animate-fade-in">
            {/* Status */}
            <div className="card flex items-center justify-between border-2 border-green-500/20 shadow-green-500/5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${wpStatus?.status === 'open' ? 'bg-green-500' : 'bg-red-500 animate-pulse shadow-red-500 shadow-sm'}`} />
                <h3 className="font-bold text-gray-800">Status da Conexão: <span className={`uppercase ${wpStatus?.status === 'open' ? 'text-green-600' : 'text-red-500'}`}>{wpStatus?.status || 'Carregando...'}</span></h3>
              </div>
              <button onClick={() => refetchWpStatus()} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" title="Atualizar Status"><RefreshCw className="w-4 h-4 text-gray-600" /></button>
            </div>
            
            {/* QR Code */}
            {wpStatus?.status !== 'open' && (
              <div className="card text-center space-y-4">
                <h3 className="font-bold text-gray-800 text-sm">Conectar Dispositivo</h3>
                <p className="text-xs text-gray-500">Seu WhatsApp está desconectado. Gere um novo QR Code para ler no celular da clínica.</p>
                {qrCodeData ? (
                  <div className="flex flex-col items-center gap-4">
                    <img src={qrCodeData} alt="QR Code" className="w-64 h-64 border-4 border-gray-100 rounded-2xl shadow-sm" />
                    <button 
                      onClick={async () => {
                        try {
                          const b64 = await generateQR.mutateAsync()
                          setQrCodeData(b64 || '')
                        } catch (err: any) {
                          toast.error('Erro ao gerar QR Code: ' + err.message)
                        }
                      }}
                      disabled={generateQR.isPending}
                      className="text-xs text-gray-500 underline"
                    >
                      {generateQR.isPending ? 'Atualizando...' : 'O QR Code expirou? Gerar de novo'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={async () => {
                      try {
                        const b64 = await generateQR.mutateAsync()
                        setQrCodeData(b64 || '')
                      } catch (err: any) {
                        toast.error('Erro ao gerar QR Code: ' + err.message)
                      }
                    }}
                    disabled={generateQR.isPending}
                    className="btn-primary max-w-[200px] mx-auto"
                  >
                    {generateQR.isPending ? 'Carregando...' : 'Gerar QR Code'}
                  </button>
                )}
              </div>
            )}

            {/* Testes */}
            <div className="card space-y-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Send className="w-4 h-4 text-green-600" /> Teste Rápido de Mensagem</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="tel" placeholder="Nº (Ex: 5511999999999)" className="input-field sm:w-1/3" value={testPhone} onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))} />
                <input placeholder="Mensagem de teste..." className="input-field flex-1" value={testMsg} onChange={e => setTestMsg(e.target.value)} />
                <button 
                  disabled={testWp.isPending || !testPhone || !testMsg} 
                  onClick={async () => {
                    try {
                      await testWp.mutateAsync({ telefone: testPhone, texto: testMsg })
                      toast.success('Enviado!')
                    } catch {
                      toast.error('Falha ao enviar.')
                    }
                  }}
                  className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {testWp.isPending ? '...' : 'Enviar'}
                </button>
              </div>
            </div>

            {/* Mensagens Personalizadas */}
            <form onSubmit={handleSaveSettings} className="card animate-fade-in space-y-4 border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Personalização de Textos</h3>
              
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <strong>Dica de Variáveis:</strong> Você pode usar palavras-chave que serão substituídas automaticamente pelo robô:
                  <br/>• <code>{"{cliente}"}</code> - Nome do paciente
                  <br/>• <code>{"{profissional}"}</code> - Nome do especialista
                  <br/>• <code>{"{data}"}</code> - Ex: "15/10/2026 às 14:30"
                </p>
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Mensagem de Boas Vindas (Disparo Imediato)</label>
                <textarea 
                  className="input-field min-h-[100px] resize-y text-sm font-medium text-gray-700" 
                  value={msgCreated} 
                  onChange={e => setMsgCreated(e.target.value)} 
                  placeholder="Olá {cliente}! 📅 Seu agendamento com {profissional} para {data} foi registrado com sucesso!\n\n⏳ Nós enviaremos uma mensagem de confirmação 2 horas antes da consulta." 
                />
              </div>
              
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Mensagem de Confirmação (2 horas antes)</label>
                <textarea 
                  className="input-field min-h-[100px] resize-y text-sm font-medium text-gray-700" 
                  value={msgConfirmation} 
                  onChange={e => setMsgConfirmation(e.target.value)} 
                  placeholder="Olá {cliente}! Você tem um agendamento com {profissional} para {data}.\n\nResponda *1* para CONFIRMAR ou *2* para CANCELAR." 
                />
                <div className="mt-3 p-3 bg-green-50/50 rounded-lg border border-green-100 space-y-2">
                  <p className="text-xs text-green-800 font-medium">
                    Teste completo: cria um agendamento pendente de teste, envia a mensagem e monitora se você responder <strong>1</strong> ou <strong>2</strong> no WhatsApp.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      placeholder="Nº WhatsApp (Ex: 5511999999999)"
                      className="input-field sm:w-1/3 text-sm"
                      value={testConfirmationPhone}
                      onChange={e => setTestConfirmationPhone(e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      type="button"
                      disabled={testConfirmation.isPending || !testConfirmationPhone || awaitingConfirmationReply}
                      onClick={async () => {
                        try {
                          const result = await testConfirmation.mutateAsync({
                            telefone: testConfirmationPhone,
                            msg_confirmation: msgConfirmation || undefined,
                          })
                          setTestConfirmationApptId(result.appointment_id)
                          setAwaitingConfirmationReply(true)
                          toast.success('Mensagem enviada! Responda 1 ou 2 no WhatsApp.')
                        } catch {
                          toast.error('Falha ao enviar. Verifique a conexão do WhatsApp.')
                        }
                      }}
                      className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {testConfirmation.isPending ? 'Enviando...' : 'Enviar teste de confirmação'}
                    </button>
                  </div>
                  {awaitingConfirmationReply && (
                    <div className="p-3 bg-white rounded-lg border border-green-200 space-y-2">
                      <p className="text-sm font-semibold text-green-700 animate-pulse">
                        Aguardando sua resposta no WhatsApp...
                      </p>
                      <p className="text-xs text-gray-600">
                        Responda <strong>1</strong> para confirmar ou <strong>2</strong> para cancelar.
                        O painel atualiza automaticamente quando o webhook receber a mensagem.
                      </p>
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                        Se nada mudar após responder, verifique na Evolution API se o webhook aponta para{' '}
                        <code className="text-[10px]">/webhooks/whatsapp</code> com o evento{' '}
                        <code className="text-[10px]">messages.upsert</code>.
                      </p>
                      {testConfirmationAppt && (
                        <p className="text-xs text-gray-500">
                          Status atual: <span className="font-bold uppercase">{testConfirmationAppt.status}</span>
                          {' · '}
                          {testConfirmationAppt.professional_name}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAwaitingConfirmationReply(false)
                          setTestConfirmationApptId(null)
                        }}
                        className="text-xs text-gray-500 underline"
                      >
                        Parar monitoramento
                      </button>
                    </div>
                  )}
                  {!awaitingConfirmationReply && testConfirmationAppt?.status === 'confirmed' && (
                    <p className="text-xs text-green-700 font-medium">Último teste: confirmado com sucesso.</p>
                  )}
                  {!awaitingConfirmationReply && testConfirmationAppt?.status === 'cancelled' && testConfirmationAppt.notes?.includes('[WhatsApp]') && (
                    <p className="text-xs text-green-700 font-medium">Último teste: cancelamento recebido com sucesso.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Resposta do Robô para CONFIRMADO (Digitou 1)</label>
                <textarea 
                  className="input-field min-h-[80px] resize-y text-sm font-medium text-gray-700" 
                  value={msgFeedbackConfirmed} 
                  onChange={e => setMsgFeedbackConfirmed(e.target.value)} 
                  placeholder="Seu agendamento foi *CONFIRMADO* com sucesso! Aguardamos você." 
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Resposta do Robô para CANCELADO (Digitou 2)</label>
                <textarea 
                  className="input-field min-h-[80px] resize-y text-sm font-medium text-gray-700" 
                  value={msgFeedbackCancelled} 
                  onChange={e => setMsgFeedbackCancelled(e.target.value)} 
                  placeholder="Seu agendamento foi *CANCELADO*." 
                />
              </div>

              <button disabled={updateSettings.isPending} type="submit" className="btn-primary py-3 text-sm mt-2">
                {updateSettings.isPending ? 'Salvando...' : 'Salvar Textos Personalizados'}
              </button>
            </form>
          </div>
        )}

        {/* Aba de Agendamentos */}
        {showAppointmentsTab && (
          <section className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Gestão de Agendamentos
              </h2>
              
              <div className="flex bg-gray-200/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setFilterPeriod('hoje')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterPeriod === 'hoje' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoje</button>
                <button onClick={() => setFilterPeriod('semana')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterPeriod === 'semana' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semana</button>
                <button onClick={() => setFilterPeriod('mes')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterPeriod === 'mes' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mês</button>
                <button onClick={() => setFilterPeriod('todos')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterPeriod === 'todos' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Status</label>
                <select className="input-field py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="pending">Apenas Pendentes</option>
                  <option value="confirmed">Apenas Confirmados</option>
                  <option value="cancelled">Apenas Cancelados</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Especialista</label>
                <select className="input-field py-1.5 text-sm" value={filterProfessional} onChange={e => setFilterProfessional(e.target.value)}>
                  <option value="">Todos os especialistas</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
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
