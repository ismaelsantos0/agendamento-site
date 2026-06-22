import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Calendar, LogOut, CheckCircle, XCircle, UserPlus, Clock, Settings, CalendarCheck, MessageCircle, RefreshCw, Send, User, Search, Trash2, Link } from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays, addWeeks, subWeeks, isSameDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import LoginPage from './LoginPage'
import { Appointment, AddressInfo, WeeklySchedule, ServiceItem } from '../types'
import { 
  useAppointments, 
  useProfessionals, 
  useCreateProfessional, 
  useUpdateProfessional,
  useDeleteProfessional,
  useCreateAvailabilityRule, 
  useSettings, 
  useUpdateSettings,
  useServices,
  useSyncServices,
  useDeleteAvailabilityRule,
  useBlockouts,
  useCreateBlockout,
  useDeleteBlockout,
  useAvailability,
  useUpdateAppointmentStatus,
  useWhatsAppStatus,
  useWhatsAppQR,
  useWhatsappLogout,
  useTestWhatsApp,
  useTestConfirmationMessage,
  useAppointmentById,
  useRescheduleAppointment,
  useCompleteAppointment,
  usePatientHistory,
  useCreateAppointment,
  usePatients
} from '../hooks/useAppointments'
import { useCurrentUser, useUsers, useCreateUser, useDeleteUser } from '../hooks/useUsers'

// Decodifica o payload do JWT para obter o role imediatamente,
// sem precisar esperar a chamada /auth/me. O JWT e base64 e pode
// ser lido no cliente com seguranca (apenas validado no servidor).
function decodificarToken(): { role?: string; professional_id?: string } {
  try {
    const token = localStorage.getItem('@agendamentos:token')
    if (!token) return {}
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return {}
  }
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // Role decodificado instantaneamente do token JWT local
  // Usado para renderizar os menus CORRETOS desde o primeiro frame,
  // evitando qualquer flash de menus errados durante o carregamento.
  const [roleInicial] = useState<string>(() => decodificarToken().role || '')
  const [profIdInicial] = useState<string>(() => decodificarToken().professional_id || '')
  const [calendarView, setCalendarView] = useState<'list' | 'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [filterPeriod, setFilterPeriod] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('hoje')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterProfessional, setFilterProfessional] = useState<string>('')
  
  let startDate: string | undefined = undefined
  let endDate: string | undefined = undefined

  if (calendarView === 'day') {
    startDate = format(startOfDay(currentDate), 'yyyy-MM-dd')
    endDate = format(endOfDay(currentDate), 'yyyy-MM-dd')
  } else if (calendarView === 'week') {
    startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  } else {
    const now = new Date()
    if (filterPeriod === 'hoje') {
      startDate = format(startOfDay(now), 'yyyy-MM-dd')
      endDate = format(endOfDay(now), 'yyyy-MM-dd')
    } else if (filterPeriod === 'semana') {
      startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    } else if (filterPeriod === 'mes') {
      startDate = format(startOfMonth(now), 'yyyy-MM-dd')
      endDate = format(endOfMonth(now), 'yyyy-MM-dd')
    }
  }

  const { data: appointments = [] } = useAppointments(
    filterProfessional || undefined, 
    startDate, 
    endDate, 
    filterStatus || undefined
  )
  const { data: professionals = [], isLoading: isLoadingProfessionals } = useProfessionals()
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()
  // Usa o role do servidor se disponivel, caso contrario usa o do token JWT
  const role = currentUser?.role || roleInicial
  const profId = currentUser?.professional_id || profIdInicial
  const createProf = useCreateProfessional()
  const updateProf = useUpdateProfessional()
  const deleteProf = useDeleteProfessional()
  const createRule = useCreateAvailabilityRule()
  const deleteRule = useDeleteAvailabilityRule()
  const createBlockout = useCreateBlockout()
  const deleteBlockout = useDeleteBlockout()

  // Estados dos novos formulários
  const [showProfForm, setShowProfForm] = useState(false)
  const [newProfName, setNewProfName] = useState('')
  const [newProfProfession, setNewProfProfession] = useState('')
  const [newProfContact, setNewProfContact] = useState('')
  
  const [editingProfId, setEditingProfId] = useState<string | null>(null)
  const [editProfName, setEditProfName] = useState('')
  const [editProfProfession, setEditProfProfession] = useState('')
  const [editProfContact, setEditProfContact] = useState('')
  const [editProfNotifyNew, setEditProfNotifyNew] = useState(true)
  const [editProfNotifyCancelled, setEditProfNotifyCancelled] = useState(true)
  const [editProfNotifyRescheduled, setEditProfNotifyRescheduled] = useState(true)
  const [editProfNotifyUpcoming, setEditProfNotifyUpcoming] = useState(true)
  const [editProfHasCustomLink, setEditProfHasCustomLink] = useState(false)

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
  
  const logoutWhatsapp = useWhatsappLogout()
  const { data: dbServices = [] } = useServices()
  const syncServices = useSyncServices()
  
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [showAppointmentsTab, setShowAppointmentsTab] = useState(true)
  const [showPatientsTab, setShowPatientsTab] = useState(false)
  const [showUsersTab, setShowUsersTab] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isSoloMode, setIsSoloMode] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState('60')

  const [cancelModalApptId, setCancelModalApptId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<Appointment | null>(null)

  const [completeModalAppt, setCompleteModalAppt] = useState<Appointment | null>(null)
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [wantsReturn, setWantsReturn] = useState(false)
  const [returnModalAppt, setReturnModalAppt] = useState<Appointment | null>(null)

  const [historyModalPatient, setHistoryModalPatient] = useState<{name: string, phone: string} | null>(null)

  const updateAppointmentStatus = useUpdateAppointmentStatus()
  const rescheduleAppointment = useRescheduleAppointment()
  const completeAppointment = useCompleteAppointment()
  const createAppointment = useCreateAppointment()

  // Estados do WhatsApp
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
  const [clinicName, setClinicName] = useState('')
  const [allowCustomLinks, setAllowCustomLinks] = useState(false)
  
  const defaultAddress: AddressInfo = { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', mapsLink: '' }
  const [addressInfo, setAddressInfo] = useState<AddressInfo>(defaultAddress)
  
  const defaultSchedule: WeeklySchedule = {
    monday: { isOpen: true, start: '08:00', end: '18:00' },
    tuesday: { isOpen: true, start: '08:00', end: '18:00' },
    wednesday: { isOpen: true, start: '08:00', end: '18:00' },
    thursday: { isOpen: true, start: '08:00', end: '18:00' },
    friday: { isOpen: true, start: '08:00', end: '18:00' },
    saturday: { isOpen: false, start: '08:00', end: '12:00' },
    sunday: { isOpen: false, start: '08:00', end: '12:00' }
  }
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultSchedule)

  const [cepLoading, setCepLoading] = useState(false)
  
  const [servicesList, setServicesList] = useState<ServiceItem[]>([])
  
  // Estados de Abas da Central de Configurações
  const [activeSettingsTab, setActiveSettingsTab] = useState<'company' | 'services' | 'general' | 'whatsapp'>('company')

  // Atualiza input quando carregar settings do backend
  useEffect(() => {
    if (settings) {
      setDurationMinutes(settings.appointment_duration_minutes.toString())
      setMsgCreated(settings.msg_created || '')
      setMsgConfirmation(settings.msg_confirmation || '')
      setMsgFeedbackConfirmed(settings.msg_feedback_confirmed || '')
      setMsgFeedbackCancelled(settings.msg_feedback_cancelled || '')
      setClinicName(settings.clinic_name || '')
      setAllowCustomLinks(settings.allow_custom_links ?? false)
      try {
        if (settings.address) setAddressInfo(JSON.parse(settings.address))
      } catch { /* legacy string */ }
      try {
        if (settings.opening_hours) setWeeklySchedule(JSON.parse(settings.opening_hours))
      } catch { /* legacy string */ }
    }
  }, [settings])

  useEffect(() => {
    if (dbServices && dbServices.length > 0) {
      setServicesList(dbServices)
    }
  }, [dbServices])

  useEffect(() => {
    // Exibe o Onboarding Wizard para clientes (clínica) que acessam pela primeira vez
    if (currentUser && currentUser.role === 'clinica') {
      const hasDismissed = localStorage.getItem(`@agendamentos:onboarding_${currentUser.id}`)
      if (!hasDismissed) {
        if (professionals.length === 0) {
          // Usa um timeout para evitar flashes durante o carregamento inicial
          const timer = setTimeout(() => setShowOnboarding(true), 800)
          return () => clearTimeout(timer)
        } else {
          // Se já tem profissionais, nunca mais mostra
          localStorage.setItem(`@agendamentos:onboarding_${currentUser.id}`, 'true')
          setShowOnboarding(false)
        }
      }
    }
  }, [currentUser, professionals])

  useEffect(() => {
    if (currentUser) {
      setIsSoloMode(localStorage.getItem(`@agendamentos:is_solo_${currentUser.id}`) === 'true')
    }
  }, [currentUser, showOnboarding]) // showOnboarding dependency to update after wizard

  useEffect(() => {
    // Usa profIdInicial (do JWT) caso currentUser ainda nao chegou
    const id = currentUser?.professional_id || profIdInicial
    if ((role === 'profissional' || roleInicial === 'profissional') && id) {
      setFilterProfessional(id)
      setRuleProfId(id)
    }
  }, [currentUser])

  const buscarCep = async () => {
    const cepNumbers = addressInfo.cep.replace(/\D/g, '')
    if (cepNumbers.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setAddressInfo(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCepLoading(false)
    }
  }

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

  if (!isAuthenticated) return <LoginPage />

  // Bloqueia o render até o perfil do usuário ser carregado do servidor.
  // Sem isso, no primeiro render currentUser é undefined e todas as abas
  // aparecem para todos os perfis por uma fração de segundo.
  if (isLoadingUser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Carregando painel...</p>
      </div>
    </div>
  )

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
      await createProf.mutateAsync({ 
        name: newProfName,
        profession: newProfProfession,
        contact_number: newProfContact,
        notify_new: true,
        notify_cancelled: true,
        notify_rescheduled: true,
        notify_upcoming: true,
        has_custom_link: false,
        is_active: true
      })
      toast.success('Profissional cadastrado!')
      setNewProfName('')
      setNewProfProfession('')
      setNewProfContact('')
      setShowProfForm(false)
    } catch {
      toast.error('Erro ao cadastrar profissional.')
    }
  }

  const handleEditProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfId || !editProfName.trim()) return
    try {
      await updateProf.mutateAsync({
        id: editingProfId,
        name: editProfName,
        profession: editProfProfession,
        contact_number: editProfContact,
        notify_new: editProfNotifyNew,
        notify_cancelled: editProfNotifyCancelled,
        notify_rescheduled: editProfNotifyRescheduled,
        notify_upcoming: editProfNotifyUpcoming,
        has_custom_link: editProfHasCustomLink,
        is_active: true
      })
      toast.success('Profissional atualizado!')
      setEditingProfId(null)
    } catch {
      toast.error('Erro ao atualizar profissional.')
    }
  }

  const handleDeleteProfessional = async (profId: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este profissional? Isso irá ocultá-lo da lista.')) return
    try {
      await deleteProf.mutateAsync(profId)
      toast.success('Profissional removido!')
      setEditingProfId(null)
    } catch {
      toast.error('Erro ao remover profissional.')
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
    if (isNaN(minutes) || minutes < 15) {
      toast.error('Duração inválida.')
      return
    }
    try {
      await updateSettings.mutateAsync({ 
        appointment_duration_minutes: minutes,
        clinic_name: clinicName,
        address: JSON.stringify(addressInfo),
        opening_hours: JSON.stringify(weeklySchedule),
        msg_created: msgCreated.trim() || undefined,
        msg_confirmation: msgConfirmation.trim() || undefined,
        msg_feedback_confirmed: msgFeedbackConfirmed.trim() || undefined,
        msg_feedback_cancelled: msgFeedbackCancelled.trim() || undefined,
        allow_custom_links: allowCustomLinks
      })
      toast.success('Configurações gerais salvas!')
      setShowSettingsForm(false)
    } catch {
      toast.error('Erro ao salvar configurações gerais.')
    }
  }

  const handleSaveServices = async () => {
    try {
      await syncServices.mutateAsync(servicesList);
      toast.success('Serviços salvos com sucesso!');
    } catch {
      toast.error('Erro ao salvar serviços.');
    }
  }

  const handleLogout = () => {
    // Limpa token e TODOS os dados em cache para garantir que o próximo
    // usuário não veja dados do usuário anterior
    localStorage.removeItem('@agendamentos:token')
    sessionStorage.clear()
    queryClient.clear()
    window.location.href = window.location.pathname
  }

  const diasSemana = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white pt-12 pb-6 px-6 rounded-b-[2rem] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Gestão</h1>
            {role && (
              <p className="text-xs text-white/70 capitalize">{role === 'master' ? 'Master' : role === 'clinica' ? 'Clinica' : 'Profissional'}</p>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </header>

      <main className="px-5 py-6 space-y-6">
        
        {/* Sessão: Abas Principais */}
        <section className="flex flex-wrap gap-2">

          {/* AGENDA — todos os perfis veem */}
          <button onClick={() => { setShowAppointmentsTab(!showAppointmentsTab); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); setShowPatientsTab(false); setShowUsersTab(false); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showAppointmentsTab ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <CalendarCheck className={`w-6 h-6 mb-2 ${showAppointmentsTab ? 'text-primary' : 'text-gray-500'}`} />
            Agenda
          </button>
          
          {/* PRONTUÁRIOS — todos os perfis veem */}
          <button onClick={() => { setShowPatientsTab(!showPatientsTab); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); setShowUsersTab(false); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showPatientsTab ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <User className={`w-6 h-6 mb-2 ${showPatientsTab ? 'text-purple-600' : 'text-gray-500'}`} />
            Prontuários
          </button>

          {/* PROFISSIONAIS — apenas master e clinica */}
          {role !== 'profissional' && (
            <button onClick={() => { setShowProfForm(!showProfForm); setShowAppointmentsTab(false); setShowRuleForm(false); setShowSettingsForm(false); setShowPatientsTab(false); setShowUsersTab(false); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showProfForm ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
              <UserPlus className={`w-6 h-6 mb-2 ${showProfForm ? 'text-primary' : 'text-gray-500'}`} />
              {isSoloMode ? 'Meu Perfil' : 'Profissionais'}
            </button>
          )}

          {/* HORÁRIOS — todos os perfis veem (profissional vê só o próprio) */}
          <button onClick={() => { setShowRuleForm(!showRuleForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowSettingsForm(false); setShowPatientsTab(false); setShowUsersTab(false); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showRuleForm ? 'bg-secondary-dark/10 border-secondary-dark text-secondary-dark' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
            <Clock className={`w-6 h-6 mb-2 ${showRuleForm ? 'text-secondary-dark' : 'text-gray-500'}`} />
            Horários
          </button>

          {/* USUÁRIOS — apenas master */}
          {role === 'master' && (
            <button onClick={() => { setShowUsersTab(!showUsersTab); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); setShowPatientsTab(false); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showUsersTab ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
              <User className={`w-6 h-6 mb-2 ${showUsersTab ? 'text-indigo-600' : 'text-gray-500'}`} />
              Usuários
            </button>
          )}

          {/* CONFIGURAÇÕES — master (Sistema completo) e clinica (só Perfil/Dados da Empresa) */}
          {role !== 'profissional' && (
            <button onClick={() => { setShowSettingsForm(!showSettingsForm); setShowAppointmentsTab(false); setShowProfForm(false); setShowRuleForm(false); setShowPatientsTab(false); setShowUsersTab(false); setActiveSettingsTab('company'); }} className={`flex-1 min-w-[100px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showSettingsForm ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
              <Settings className={`w-6 h-6 mb-2 ${showSettingsForm ? 'text-white' : 'text-gray-500'}`} />
              {role === 'master' ? 'Sistema' : 'Perfil'}
            </button>
          )}
        </section>

        {/* Form: Especialista */}
        {showProfForm && (
          <div className="animate-fade-in space-y-6">
            {!editingProfId && !isSoloMode ? (
              <form onSubmit={handleAddProfessional} className="card space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">Cadastrar Profissional</h3>
                <input 
                  placeholder="Nome Completo (Ex: Dr. João Silva)" 
                  className="input-field" 
                  value={newProfName} 
                  onChange={e => setNewProfName(e.target.value)} 
                />
                <input 
                  placeholder="Profissão (Ex: Dentista)" 
                  className="input-field" 
                  value={newProfProfession} 
                  onChange={e => setNewProfProfession(e.target.value)} 
                />
                <input 
                  placeholder="Número WhatsApp (Ex: 5511999999999)" 
                  className="input-field" 
                  value={newProfContact} 
                  onChange={e => setNewProfContact(e.target.value)} 
                />
                <button disabled={createProf.isPending} type="submit" className="btn-primary py-2 text-xs">
                  {createProf.isPending ? 'Salvando...' : 'Salvar Especialista'}
                </button>
              </form>
            ) : editingProfId ? (
              <form onSubmit={handleEditProfessional} className="card space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-sm">Editar Profissional</h3>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleDeleteProfessional(editingProfId)} className="text-red-400 hover:text-red-600 p-1" title="Apagar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => setEditingProfId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <input 
                    placeholder="Nome Completo" 
                    className="input-field" 
                    value={editProfName} 
                    onChange={e => setEditProfName(e.target.value)} 
                  />
                  <input 
                    placeholder="Profissão" 
                    className="input-field" 
                    value={editProfProfession} 
                    onChange={e => setEditProfProfession(e.target.value)} 
                  />
                  <input 
                    placeholder="Número WhatsApp" 
                    className="input-field" 
                    value={editProfContact} 
                    onChange={e => setEditProfContact(e.target.value)} 
                  />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-600 mb-3">Notificações WhatsApp</h4>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={editProfNotifyNew} onChange={e => setEditProfNotifyNew(e.target.checked)} className="rounded text-primary" />
                    <span className="text-sm text-gray-700">Novos Agendamentos</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={editProfNotifyCancelled} onChange={e => setEditProfNotifyCancelled(e.target.checked)} className="rounded text-primary" />
                    <span className="text-sm text-gray-700">Cancelamentos</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={editProfNotifyRescheduled} onChange={e => setEditProfNotifyRescheduled(e.target.checked)} className="rounded text-primary" />
                    <span className="text-sm text-gray-700">Remarcações</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editProfNotifyUpcoming} onChange={e => setEditProfNotifyUpcoming(e.target.checked)} className="rounded text-primary" />
                    <span className="text-sm text-gray-700">Lembretes de Consultas</span>
                  </label>
                  {(role === 'master' || settings?.allow_custom_links) && (
                    <label className="flex items-center gap-2 cursor-pointer mt-4 pt-4 border-t border-gray-100">
                      <input type="checkbox" checked={editProfHasCustomLink} onChange={e => setEditProfHasCustomLink(e.target.checked)} className="rounded text-primary" />
                      <span className="text-sm font-bold text-gray-800">Habilitar Link Exclusivo (SaaS)</span>
                    </label>
                  )}
                </div>
                <button disabled={updateProf.isPending} type="submit" className="btn-primary py-2 text-xs w-full">
                  {updateProf.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            ) : null}

            {!editingProfId && !isSoloMode && (
              <div className="card space-y-3">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Profissionais Cadastrados</h3>
                {professionals.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum profissional cadastrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {professionals.map(prof => (
                      <li key={prof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{prof.name}</p>
                          {(prof.profession || prof.contact_number) && (
                            <p className="text-xs text-gray-500 mb-1">
                              {prof.profession}{prof.profession && prof.contact_number ? ' • ' : ''}{prof.contact_number}
                            </p>
                          )}
                          {prof.has_custom_link && prof.slug && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100">/agendar/{prof.slug}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/agendar/${prof.slug}`)
                                  toast.success('Link copiado!')
                                }}
                                className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline"
                              >
                                Copiar Link
                              </button>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            setEditingProfId(prof.id)
                            setEditProfName(prof.name)
                            setEditProfProfession(prof.profession || '')
                            setEditProfContact(prof.contact_number || '')
                            setEditProfNotifyNew(prof.notify_new ?? true)
                            setEditProfNotifyCancelled(prof.notify_cancelled ?? true)
                            setEditProfNotifyRescheduled(prof.notify_rescheduled ?? true)
                            setEditProfNotifyUpcoming(prof.notify_upcoming ?? true)
                            setEditProfHasCustomLink(prof.has_custom_link ?? false)
                          }}
                          className="text-primary hover:text-primary-dark text-xs font-semibold px-3 py-1 bg-primary/10 rounded-full"
                        >
                          Editar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {isSoloMode && professionals.length > 0 && !editingProfId && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => {
                    const myProf = professionals.find(p => p.name === currentUser?.username) || professionals[0];
                    if (myProf) {
                        setEditingProfId(myProf.id)
                        setEditProfName(myProf.name)
                        setEditProfProfession(myProf.profession || '')
                        setEditProfContact(myProf.contact_number || '')
                        setEditProfNotifyNew(myProf.notify_new ?? true)
                        setEditProfNotifyCancelled(myProf.notify_cancelled ?? true)
                        setEditProfNotifyRescheduled(myProf.notify_rescheduled ?? true)
                        setEditProfNotifyUpcoming(myProf.notify_upcoming ?? true)
                        setEditProfHasCustomLink(myProf.has_custom_link ?? false)
                    }
                  }}
                  className="btn-primary w-full py-3"
                >
                  Editar Meu Perfil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form: Horários */}
        {showRuleForm && (
          <div className="card animate-fade-in space-y-6">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Gerenciar Horários e Pausas</h3>
              {role !== 'profissional' && (
                <select className="input-field py-2" value={ruleProfId} onChange={e => setRuleProfId(e.target.value)}>
                  <option value="">Selecione o profissional...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
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

        {/* Painel Central de Configurações */}
        {showSettingsForm && (
          <div className="card animate-fade-in space-y-6 border border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200">
              <Settings className="w-5 h-5 text-gray-500" />
              Central de Configurações
            </h2>

            {/* Abas Internas */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button onClick={() => setActiveSettingsTab('company')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'company' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dados da Empresa</button>
              {role === 'master' && (
                <>
                  <button onClick={() => setActiveSettingsTab('services')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'services' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Serviços</button>
                  <button onClick={() => setActiveSettingsTab('general')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'general' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Gerais</button>
                  <button onClick={() => setActiveSettingsTab('whatsapp')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>WhatsApp & Mensagens</button>
                </>
              )}
            </div>

            {/* Conteúdo das Abas */}
            
            {activeSettingsTab === 'company' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in bg-white p-5 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm">Dados da Clínica</h3>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Nome da Clínica / Empresa</label>
                  <input className="input-field" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Ex: Clínica Saúde Ideal" />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="relative">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">CEP</label>
                      <input className="input-field" value={addressInfo.cep} onChange={e => setAddressInfo({...addressInfo, cep: e.target.value})} onBlur={buscarCep} placeholder="00000-000" maxLength={9} />
                      {cepLoading && <span className="absolute right-3 top-[26px] text-xs text-primary animate-pulse">Buscando...</span>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Rua / Avenida</label>
                      <input className="input-field" value={addressInfo.street} onChange={e => setAddressInfo({...addressInfo, street: e.target.value})} placeholder="Ex: Av. Paulista" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Número</label>
                      <input className="input-field" value={addressInfo.number} onChange={e => setAddressInfo({...addressInfo, number: e.target.value})} placeholder="Ex: 1000" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Bairro</label>
                      <input className="input-field" value={addressInfo.neighborhood} onChange={e => setAddressInfo({...addressInfo, neighborhood: e.target.value})} placeholder="Ex: Bela Vista" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">UF</label>
                      <input className="input-field" value={addressInfo.state} onChange={e => setAddressInfo({...addressInfo, state: e.target.value})} placeholder="SP" maxLength={2} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block text-blue-600">Link do Google Maps (Opcional)</label>
                    <input className="input-field border-blue-100 bg-blue-50/30 focus:bg-white" value={addressInfo.mapsLink} onChange={e => setAddressInfo({...addressInfo, mapsLink: e.target.value})} placeholder="Cole o link de compartilhamento do Google Maps aqui" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-3">Horário de Funcionamento Semanal</h4>
                  <div className="space-y-2">
                    {Object.entries({
                      monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo'
                    }).map(([dayKey, dayLabel]) => {
                      const d = dayKey as keyof typeof weeklySchedule;
                      const sched = weeklySchedule[d];
                      return (
                        <div key={dayKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <button 
                              type="button" 
                              onClick={() => setWeeklySchedule({...weeklySchedule, [d]: {...sched, isOpen: !sched.isOpen}})}
                              className={`w-10 h-6 rounded-full transition-colors relative ${sched.isOpen ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${sched.isOpen ? 'right-1' : 'left-1'}`} />
                            </button>
                            <span className={`text-xs font-bold ${sched.isOpen ? 'text-gray-800' : 'text-gray-400'}`}>{dayLabel}</span>
                          </div>
                          
                          {sched.isOpen ? (
                            <div className="flex items-center gap-2">
                              <input type="time" className="input-field py-1.5 text-xs text-center w-24" value={sched.start} onChange={e => setWeeklySchedule({...weeklySchedule, [d]: {...sched, start: e.target.value}})} />
                              <span className="text-xs text-gray-400 font-bold">às</span>
                              <input type="time" className="input-field py-1.5 text-xs text-center w-24" value={sched.end} onChange={e => setWeeklySchedule({...weeklySchedule, [d]: {...sched, end: e.target.value}})} />
                            </div>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded">Fechado</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button disabled={updateSettings.isPending} type="submit" className="btn-primary w-full sm:w-auto py-3 text-sm shadow-md">
                    {updateSettings.isPending ? 'Salvando...' : 'Salvar Dados da Clínica'}
                  </button>
                </div>
              </form>
            )}
            
            {activeSettingsTab === 'services' && (
              <div className="space-y-6 animate-fade-in bg-white p-5 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm">Serviços Oferecidos</h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newId = Math.random().toString(36).substr(2, 9);
                      setServicesList([...servicesList, { id: newId, name: '', duration_minutes: parseInt(durationMinutes) || 60 }]);
                    }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    + Novo Serviço
                  </button>
                </div>
                
                {servicesList.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-xl">Nenhum serviço cadastrado. Clique em "+ Novo Serviço".</p>
                ) : (
                  <div className="space-y-3">
                    {servicesList.map((svc, index) => (
                      <div key={svc.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl relative group">
                        <div className="md:col-span-6">
                          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Nome do Serviço</label>
                          <input 
                            className="input-field py-1.5 text-xs" 
                            placeholder="Ex: Limpeza de Pele" 
                            value={svc.name}
                            onChange={(e) => {
                              const newServices = [...servicesList];
                              newServices[index].name = e.target.value;
                              setServicesList(newServices);
                            }}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Duração (min)</label>
                          <input 
                            type="number"
                            className="input-field py-1.5 text-xs" 
                            value={svc.duration_minutes}
                            onChange={(e) => {
                              const newServices = [...servicesList];
                              newServices[index].duration_minutes = parseInt(e.target.value) || 0;
                              setServicesList(newServices);
                            }}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Preço (Opcional)</label>
                          <input 
                            className="input-field py-1.5 text-xs" 
                            placeholder="R$ 100,00" 
                            value={svc.price || ''}
                            onChange={(e) => {
                              const newServices = [...servicesList];
                              newServices[index].price = e.target.value;
                              setServicesList(newServices);
                            }}
                          />
                        </div>
                        <div className="md:col-span-12 mt-2 pt-3 border-t border-gray-200/60">
                          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-2 block">Profissionais Habilitados</label>
                          <div className="flex flex-wrap gap-2">
                            {/* Botão "Todos" */}
                            {(() => {
                              const allIds = professionals.map(p => p.id);
                              const currentIds = svc.professional_ids || [];
                              const allSelected = allIds.length > 0 && allIds.every(id => currentIds.includes(id));
                              return (
                                <label
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${allSelected || currentIds.length === 0 ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                  onClick={() => {
                                    const newServices = [...servicesList];
                                    // Se todos marcados ou nenhum → limpa (vazio = todos permitidos)
                                    if (allSelected || currentIds.length === 0) {
                                      newServices[index].professional_ids = [];
                                    } else {
                                      newServices[index].professional_ids = [...allIds];
                                    }
                                    setServicesList(newServices);
                                  }}
                                >
                                  <div className={`w-3 h-3 rounded flex items-center justify-center border ${allSelected || currentIds.length === 0 ? 'bg-white border-white' : 'border-gray-300'}`}>
                                    {(allSelected || currentIds.length === 0) && <CheckCircle className="w-2.5 h-2.5 text-teal-500" />}
                                  </div>
                                  Todos
                                </label>
                              );
                            })()}
                            {professionals.map(p => {
                              const isSelected = svc.professional_ids?.includes(p.id);
                              return (
                                <label key={p.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${isSelected ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected || false}
                                    onChange={(e) => {
                                      const newServices = [...servicesList];
                                      const currentIds = newServices[index].professional_ids || [];
                                      if (e.target.checked) {
                                        newServices[index].professional_ids = [...currentIds, p.id];
                                      } else {
                                        newServices[index].professional_ids = currentIds.filter(id => id !== p.id);
                                      }
                                      setServicesList(newServices);
                                    }}
                                  />
                                  <div className={`w-3 h-3 rounded flex items-center justify-center border ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                                    {isSelected && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  {p.name}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newServices = servicesList.filter((_, i) => i !== index);
                            setServicesList(newServices);
                          }}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <button onClick={handleSaveServices} disabled={syncServices.isPending} className="btn-primary w-full sm:w-auto py-3 text-sm shadow-md">
                    {syncServices.isPending ? 'Salvando...' : 'Salvar Serviços'}
                  </button>
                </div>
              </div>
            )}

            {activeSettingsTab === 'general' && (
              <form onSubmit={handleSaveSettings} className="space-y-4 animate-fade-in bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm">Regras de Agendamento</h3>
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
                {role === 'master' && (
                  <div className="md:col-span-12 mt-4 pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={allowCustomLinks} onChange={e => setAllowCustomLinks(e.target.checked)} className="rounded text-primary" />
                      <span className="text-sm font-bold text-gray-800">Permitir Geração de Links Exclusivos para Profissionais (SaaS)</span>
                    </label>
                  </div>
                )}
                <button disabled={updateSettings.isPending} type="submit" className="btn-primary bg-gray-800 hover:bg-gray-900 w-full sm:w-auto py-2 text-xs mt-2">
                  {updateSettings.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </form>
            )}

            {activeSettingsTab === 'whatsapp' && (
              <div className="space-y-6 animate-fade-in bg-white p-4 rounded-xl border border-gray-200">
            {/* Status */}
            <div className="card flex items-center justify-between border-2 border-green-500/20 shadow-green-500/5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${wpStatus?.status === 'open' ? 'bg-green-500' : 'bg-red-500 animate-pulse shadow-red-500 shadow-sm'}`} />
                <h3 className="font-bold text-gray-800">Status da Conexão: <span className={`uppercase ${wpStatus?.status === 'open' ? 'text-green-600' : 'text-red-500'}`}>{wpStatus?.status || 'Carregando...'}</span></h3>
              </div>
              <div className="flex items-center gap-2">
                {wpStatus?.status === 'open' && (
                  <button 
                    onClick={async () => {
                      if(window.confirm('Tem certeza que deseja desconectar o aparelho atual? Você precisará ler o QR Code novamente.')){
                        try {
                          await logoutWhatsapp.mutateAsync()
                          toast.success('Aparelho desconectado!')
                          refetchWpStatus()
                        } catch (err: any) {
                          toast.error('Erro ao desconectar: ' + err.message)
                        }
                      }
                    }}
                    disabled={logoutWhatsapp.isPending}
                    className="flex items-center gap-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                  >
                    <LogOut className="w-4 h-4" /> Desconectar
                  </button>
                )}
                <button onClick={() => refetchWpStatus()} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" title="Atualizar Status"><RefreshCw className="w-4 h-4 text-gray-600" /></button>
              </div>
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
                    } catch (err: any) {
                      const errMsg = err.response?.data?.detail || err.message || 'Falha ao enviar.'
                      toast.error(errMsg)
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
                        } catch (err: any) {
                          const errMsg = err.response?.data?.detail || 'Falha ao enviar. Verifique a conexão do WhatsApp.'
                          toast.error(errMsg)
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
          </div>
        )}

        {showAppointmentsTab && (
          <section className="space-y-4 animate-fade-in">
            {/* Cabeçalho da Aba e Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" />
                  Gestão de Agendamentos
                </h2>
                {role === 'profissional' && professionals.find(p => p.id === profId)?.has_custom_link && professionals.find(p => p.id === profId)?.slug && (
                  <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 p-2 rounded-lg inline-flex">
                    <Link className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-mono text-teal-800">
                      /agendar/{professionals.find(p => p.id === profId)?.slug}
                    </span>
                    <button 
                      onClick={() => {
                        const slug = professionals.find(p => p.id === profId)?.slug
                        navigator.clipboard.writeText(`${window.location.origin}/agendar/${slug}`)
                        toast.success('Seu link de agendamento foi copiado!')
                      }}
                      className="text-xs font-bold bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700 transition-colors shadow-sm ml-2"
                    >
                      Copiar Meu Link
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex bg-gray-200/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button onClick={() => setCalendarView('week')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'week' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semana</button>
                <button onClick={() => setCalendarView('day')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'day' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dia</button>
                <button onClick={() => setCalendarView('list')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lista</button>
              </div>
            </div>

            {/* Controles de Navegação de Data para Semana e Dia */}
            {calendarView !== 'list' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      if (calendarView === 'day') setCurrentDate(prev => subDays(prev, 1))
                      if (calendarView === 'week') setCurrentDate(prev => subWeeks(prev, 1))
                    }}
                    className="px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-bold transition-colors border border-gray-100"
                  >
                    &larr; Anterior
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all"
                  >
                    Hoje
                  </button>
                  <button 
                    onClick={() => {
                      if (calendarView === 'day') setCurrentDate(prev => addDays(prev, 1))
                      if (calendarView === 'week') setCurrentDate(prev => addWeeks(prev, 1))
                    }}
                    className="px-3 py-1.5 hover:bg-gray-50 rounded-lg text-xs font-bold transition-colors border border-gray-100"
                  >
                    Próximo &rarr;
                  </button>
                </div>
                
                <span className="font-bold text-gray-800 text-xs sm:text-sm capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {calendarView === 'day' ? (
                    format(currentDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    `Semana: ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`
                  )}
                </span>
              </div>
            )}

            {/* Filtros Ativos (Profissional e Status) */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Especialista</label>
                <select className="input-field py-1.5 text-sm" value={filterProfessional} onChange={e => setFilterProfessional(e.target.value)}>
                  {role !== 'profissional' && <option value="">Todos os especialistas</option>}
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Status</label>
                <select className="input-field py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="pending">Apenas Aguardando Aprovação</option>
                  <option value="confirmed">Apenas Confirmados</option>
                  <option value="cancelled">Apenas Cancelados</option>
                </select>
              </div>
              {calendarView === 'list' && (
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Período</label>
                  <select className="input-field py-1.5 text-sm" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value as any)}>
                    <option value="hoje">Hoje</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mês</option>
                    <option value="todos">Todos</option>
                  </select>
                </div>
              )}
            </div>

            {/* 1. VISÃO SEMANAL (WEEK GRID) */}
            {calendarView === 'week' && (() => {
              const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
              const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
              const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 08:00 as 19:00

              const getApptPosition = (appt: any) => {
                const start = parseISO(appt.start_time)
                const end = parseISO(appt.end_time)
                const startHour = start.getHours() + start.getMinutes() / 60
                const endHour = end.getHours() + end.getMinutes() / 60
                
                const top = Math.max(0, (startHour - 8) * 4) // 4rem (h-16) por hora
                const height = Math.max(1.5, (endHour - startHour) * 4)
                return { top: `${top}rem`, height: `${height}rem` }
              }

              const diasSemanaNome = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header do Calendário Semanal */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100 bg-gray-50/50 text-center py-2.5">
                      <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center">Hora</div>
                      {daysOfWeek.map((day, idx) => {
                        const isToday = isSameDay(day, new Date())
                        return (
                          <div key={idx} className={`flex flex-col items-center justify-center py-1 rounded-xl ${isToday ? 'bg-primary/10 text-primary font-bold px-1.5' : 'text-gray-600'}`}>
                            <span className="text-[10px] font-bold uppercase">{diasSemanaNome[idx]}</span>
                            <span className="text-sm font-extrabold">{format(day, 'dd')}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Corpo do Calendário Semanal */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] relative h-[48rem]">
                      {/* Grid de Linhas de Horário (Background) */}
                      <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)] pointer-events-none">
                        <div className="col-start-1 col-end-9 grid grid-rows-12">
                          {hours.map((h) => (
                            <div key={h} className="border-b border-gray-100 h-16 flex items-start pl-2 pt-1 text-[10px] font-bold text-gray-400">
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>
                        {/* Linhas verticais */}
                        {Array.from({ length: 7 }).map((_, idx) => (
                          <div key={idx} className="border-r border-gray-50 h-full col-start-2" style={{ gridColumnStart: idx + 2 }} />
                        ))}
                      </div>

                      {/* Colunas de Conteúdo dos Agendamentos */}
                      {daysOfWeek.map((day, dayIdx) => {
                        const dayAppts = appointments.filter(appt => isSameDay(parseISO(appt.start_time), day))
                        return (
                          <div key={dayIdx} className="relative h-full col-start-2" style={{ gridColumnStart: dayIdx + 2 }}>
                            {dayAppts.map(appt => {
                              const pos = getApptPosition(appt)
                              const colorClass = appt.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 border-dashed'
                                : appt.status === 'confirmed'
                                ? 'bg-green-50 text-green-800 border-green-300'
                                : 'bg-gray-100 text-gray-500 border-gray-300 line-through'

                              return (
                                <button
                                  key={appt.id}
                                  onClick={() => setSelectedAppt(appt)}
                                  style={{ top: pos.top, height: pos.height }}
                                  className={`absolute left-1 right-1 p-1.5 border rounded-xl text-left text-[10px] overflow-hidden flex flex-col justify-between shadow-sm active:scale-[0.98] transition-all ${colorClass}`}
                                >
                                  <div>
                                    <p className="font-bold truncate leading-tight">{appt.customer_name}</p>
                                    <p className="opacity-75 truncate leading-none mt-0.5">{appt.professional_name}</p>
                                  </div>
                                  <span className="font-semibold text-[8px] self-end bg-white/60 px-1 rounded">
                                    {format(parseISO(appt.start_time), 'HH:mm')}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 2. VISÃO DIÁRIA (DAY TIMELINE) */}
            {calendarView === 'day' && (() => {
              const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 08:00 as 19:00
              const dayAppts = appointments.filter(appt => isSameDay(parseISO(appt.start_time), currentDate))

              const getApptPosition = (appt: any) => {
                const start = parseISO(appt.start_time)
                const end = parseISO(appt.end_time)
                const startHour = start.getHours() + start.getMinutes() / 60
                const endHour = end.getHours() + end.getMinutes() / 60
                
                const top = Math.max(0, (startHour - 8) * 4) // 4rem (h-16) por hora
                const height = Math.max(1.5, (endHour - startHour) * 4)
                return { top: `${top}rem`, height: `${height}rem` }
              }

              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="grid grid-cols-[60px_1fr] relative h-[48rem]">
                    {/* Linha de Horários (Grid) */}
                    <div className="absolute inset-0 grid grid-cols-[60px_1fr] pointer-events-none">
                      <div className="col-start-1 col-end-3 grid grid-rows-12">
                        {hours.map((h) => (
                          <div key={h} className="border-b border-gray-100 h-16 flex items-start text-[10px] font-bold text-gray-400 pt-1">
                            {String(h).padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Coluna Única de Agendamentos */}
                    <div className="relative h-full col-start-2 ml-4">
                      {dayAppts.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-xs font-semibold">
                          Sem agendamentos para este dia.
                        </div>
                      )}
                      
                      {dayAppts.map(appt => {
                        const pos = getApptPosition(appt)
                        const colorClass = appt.status === 'pending'
                          ? 'bg-amber-50 border-amber-300 text-amber-900 border-dashed border-2'
                          : appt.status === 'confirmed'
                          ? 'bg-green-50 border-green-300 text-green-950 border-2'
                          : 'bg-gray-100 border-gray-300 text-gray-500 line-through'

                        return (
                          <button
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt)}
                            style={{ top: pos.top, height: pos.height }}
                            className={`absolute left-0 right-0 p-3 border rounded-2xl text-left shadow-sm flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.99] ${colorClass}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-extrabold text-sm leading-snug">{appt.customer_name}</h4>
                                <p className="text-xs font-medium opacity-80 mt-0.5 flex items-center gap-1">
                                  <span>Especialista:</span> <span className="font-bold">{appt.professional_name}</span>
                                </p>
                                {appt.service_name && (
                                  <span className="inline-block mt-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {appt.service_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold bg-white/70 px-2 py-0.5 rounded-full border border-gray-100">
                                {format(parseISO(appt.start_time), 'HH:mm')} - {format(parseISO(appt.end_time), 'HH:mm')}
                              </span>
                            </div>
                            
                            {appt.notes && (
                              <p className="text-[10px] italic opacity-85 truncate mt-1 max-w-[80%]">Obs: {appt.notes}</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 3. VISÃO DE LISTA (LIST VIEW ORIGINAL) */}
            {calendarView === 'list' && (
              <>
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
                          {appt.status === 'pending' ? 'Aguardando' : appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
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

                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 mt-1">
                          {appt.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusChange(appt.id, 'confirmed')} disabled={updateAppointmentStatus.isPending} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-green-100">
                                <CheckCircle className="w-4 h-4"/> Confirmar
                              </button>
                              <button onClick={() => setCancelModalApptId(appt.id)} disabled={updateAppointmentStatus.isPending} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-red-100">
                                <XCircle className="w-4 h-4"/> Cancelar
                              </button>
                            </>
                          )}
                          <button onClick={() => setRescheduleModalAppt(appt)} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-blue-100">
                            <RefreshCw className="w-4 h-4"/> Remarcar
                          </button>
                          <button onClick={() => setCompleteModalAppt(appt)} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold active:scale-95 transition-all hover:bg-emerald-100">
                            <CalendarCheck className="w-4 h-4"/> Concluir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {showPatientsTab && (
          <PatientsTabContent onViewHistory={(patient) => setHistoryModalPatient(patient)} />
        )}

        {showUsersTab && (
          <UsersTabContent />
        )}

      </main>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-teal-400"></div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao seu painel! </h2>
              <p className="text-gray-500 text-sm">
                Percebemos que este é o seu primeiro acesso. Para configurarmos o sistema do jeito certo, como você trabalha?
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                onClick={async () => {
                  try {
                    // 1. Cria o profissional com o nome de usuário dele
                    await createProf.mutateAsync({
                      name: currentUser.username,
                      profession: 'Especialista',
                      contact_number: '',
                      notify_new: true,
                      notify_cancelled: true,
                      notify_rescheduled: true,
                      notify_upcoming: true,
                      is_active: true,
                      has_custom_link: true // Auto-habilita link exclusivo
                    })
                    // 2. Salva que já passou pelo onboarding
                    localStorage.setItem(`@agendamentos:onboarding_${currentUser.id}`, 'true')
                    // 3. Opcional: Flag de solo (se a lógica de front puder usar)
                    localStorage.setItem(`@agendamentos:is_solo_${currentUser.id}`, 'true')
                    
                    setShowOnboarding(false)
                    toast.success('Perfil Solo criado com sucesso! Tudo pronto.')
                  } catch {
                    toast.error('Erro ao configurar perfil. Tente novamente.')
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-teal-100 hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
              >
                <div>
                  <h3 className="font-bold text-teal-900 group-hover:text-teal-700">Sou Profissional Solo</h3>
                  <p className="text-xs text-teal-600/80 mt-1">Trabalho sozinho. Crie meu perfil automático e meu link de agendamento.</p>
                </div>
                <CheckCircle className="w-6 h-6 text-teal-400 group-hover:text-teal-600" />
              </button>

              <button 
                onClick={() => {
                  localStorage.setItem(`@agendamentos:onboarding_${currentUser.id}`, 'true')
                  localStorage.setItem(`@agendamentos:is_solo_${currentUser.id}`, 'false')
                  setShowOnboarding(false)
                  setShowProfForm(true)
                  setShowAppointmentsTab(false)
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
              >
                <div>
                  <h3 className="font-bold text-indigo-900 group-hover:text-indigo-700">Sou uma Clínica / Equipe</h3>
                  <p className="text-xs text-indigo-600/80 mt-1">Vou gerenciar vários profissionais. Quero configurar manualmente.</p>
                </div>
                <UserPlus className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600" />
              </button>
            </div>
            
            <p className="text-[10px] text-center text-gray-400 mt-6 pt-4 border-t border-gray-100">
              Você sempre poderá alterar configurações avançadas depois na aba de Perfil.
            </p>
          </div>
        </div>
      )}

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

      {/* Modal de Detalhes do Agendamento */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${selectedAppt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selectedAppt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedAppt.status === 'pending' ? 'Aguardando Aprovação' : selectedAppt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">{selectedAppt.customer_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedAppt(null)} 
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm font-medium text-gray-600">
              <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {format(parseISO(selectedAppt.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  {` (${format(parseISO(selectedAppt.start_time), 'HH:mm')} - ${format(parseISO(selectedAppt.end_time), 'HH:mm')})`}
                </span>
              </div>

              <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Especialista: <strong className="text-gray-800">{selectedAppt.professional_name}</strong></span>
              </div>

              {selectedAppt.service_name && (
                <div className="flex items-center gap-2.5 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Serviço: <strong className="text-blue-800">{selectedAppt.service_name}</strong></span>
                </div>
              )}

              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="font-mono text-gray-800">{selectedAppt.customer_phone}</span>
                </div>
                <a 
                  href={`https://wa.me/${selectedAppt.customer_phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-green-500/10"
                >
                  <Send className="w-3 h-3" />
                  Conversar
                </a>
              </div>

              {selectedAppt.notes && (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-xs text-amber-800">
                  <span className="font-bold block mb-1">Observações:</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedAppt.notes}</p>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedAppt(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    setHistoryModalPatient({ name: selectedAppt.customer_name, phone: selectedAppt.customer_phone });
                    setSelectedAppt(null);
                  }}
                  className="flex-1 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-bold text-sm transition-colors"
                >
                  Ver Histórico
                </button>
              </div>

              {selectedAppt.status !== 'completed' && selectedAppt.status !== 'cancelled' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setRescheduleModalAppt(selectedAppt);
                      setSelectedAppt(null);
                    }}
                    className="flex-1 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Remarcar
                  </button>
                  <button 
                    onClick={() => {
                      setCompleteModalAppt(selectedAppt);
                      setSelectedAppt(null);
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Concluir Consulta
                  </button>
                </div>
              )}

              {selectedAppt.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      await handleStatusChange(selectedAppt.id, 'confirmed');
                      setSelectedAppt(null);
                    }}
                    disabled={updateAppointmentStatus.isPending}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => {
                      setCancelModalApptId(selectedAppt.id);
                      setSelectedAppt(null);
                    }}
                    disabled={updateAppointmentStatus.isPending}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Remarcar Consulta</h3>
            <p className="text-sm text-gray-600 mb-4">Escolha a nova data e horário. O paciente receberá um aviso no WhatsApp exigindo confirmação.</p>
            
            <RescheduleModalInner 
              appt={rescheduleModalAppt} 
              onClose={() => setRescheduleModalAppt(null)} 
              onConfirm={async (date, time) => {
                const [h, m] = time.split(':').map(Number);
                const newStart = setMinutes(setHours(date, h), m);
                
                try {
                  await rescheduleAppointment.mutateAsync({
                    id: rescheduleModalAppt.id,
                    start_time: newStart.toISOString()
                  });
                  toast.success("Consulta remarcada e mensagem enviada!");
                  setRescheduleModalAppt(null);
                } catch (err: any) {
                  toast.error(err.response?.data?.detail || "Erro ao remarcar");
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Concluir Consulta</h3>
            <p className="text-sm text-gray-600 mb-4">Registre o que foi feito no atendimento de {completeModalAppt.customer_name}.</p>
            
            <textarea
              placeholder="Anotações do prontuário (Opcional)"
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              className="w-full h-32 p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
            />

            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <label className="text-sm font-bold text-emerald-800 flex items-center gap-2 cursor-pointer">
                <CalendarCheck className="w-5 h-5" /> 
                Agendar Retorno do Paciente
              </label>
              <input 
                type="checkbox" 
                checked={wantsReturn} 
                onChange={e => setWantsReturn(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setCompleteModalAppt(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    await completeAppointment.mutateAsync({
                      id: completeModalAppt.id,
                      clinical_notes: clinicalNotes
                    });

                    toast.success("Consulta concluída!");
                    const savedAppt = completeModalAppt;
                    setCompleteModalAppt(null);
                    setClinicalNotes('');
                    
                    if (wantsReturn) {
                      setReturnModalAppt(savedAppt);
                      setWantsReturn(false);
                    }
                  } catch (err: any) {
                    toast.error(err.response?.data?.detail || "Erro ao concluir");
                  }
                }}
                disabled={completeAppointment.isPending || createAppointment.isPending}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {(completeAppointment.isPending || createAppointment.isPending) ? 'Salvando...' : 'Salvar Conclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Appointment Modal */}
      {returnModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Marcar Retorno</h3>
                <p className="text-sm text-gray-600 mt-1">Escolha a data para {returnModalAppt.customer_name}</p>
              </div>
              <button 
                onClick={() => setReturnModalAppt(null)}
                className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <RescheduleModalInner 
              appt={returnModalAppt} 
              onClose={() => setReturnModalAppt(null)} 
              onConfirm={async (date, time) => {
                const [h, m] = time.split(':').map(Number);
                const newStart = setMinutes(setHours(date, h), m);
                
                try {
                  await createAppointment.mutateAsync({
                    professional_id: returnModalAppt.professional_id,
                    customer_name: returnModalAppt.customer_name,
                    customer_phone: returnModalAppt.customer_phone,
                    start_time: newStart.toISOString(),
                    service_name: returnModalAppt.service_name || undefined,
                    otp_code: "bypass_admin_123"
                  });
                  toast.success("Retorno agendado com sucesso!");
                  setReturnModalAppt(null);
                } catch (err: any) {
                  toast.error(err.response?.data?.detail || "Erro ao agendar retorno");
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {historyModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Histórico Clínico</h3>
                <p className="text-sm text-gray-500">{historyModalPatient.name} • {historyModalPatient.phone}</p>
              </div>
              <button 
                onClick={() => setHistoryModalPatient(null)} 
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <PatientHistoryList phone={historyModalPatient.phone} name={historyModalPatient.name} />
            
          </div>
        </div>
      )}
    </div>
  )
}

function PatientHistoryList({ phone, name }: { phone: string, name: string }) {
  const { data: history = [], isLoading } = usePatientHistory(phone, name);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Buscando histórico...</div>;
  
  if (history.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum histórico encontrado.</div>;

  return (
    <div className="overflow-y-auto pr-2 space-y-4">
      {history.map(appt => (
        <div key={appt.id} className="border-l-2 border-purple-200 pl-4 py-1 relative">
          <div className="absolute w-2.5 h-2.5 bg-purple-500 rounded-full -left-[5px] top-2" />
          <p className="text-xs font-bold text-purple-600 mb-1">
            {format(parseISO(appt.start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-800 flex justify-between">
              <span>{appt.service_name || 'Consulta Geral'}</span>
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>{appt.status}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Especialista: {appt.professional_name}</p>
            
            {appt.clinical_notes && (
              <div className="mt-3 bg-white p-2.5 rounded-lg border border-gray-100 text-xs text-gray-700 whitespace-pre-wrap">
                {appt.clinical_notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PatientsTabContent({ 
  onViewHistory 
}: { 
  onViewHistory: (patient: {name: string, phone: string}) => void 
}) {
  const { data: patients = [], isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando prontuários...</div>;

  const filtered = patients.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-purple-600" />
            Prontuários
          </h2>
          <p className="text-sm text-gray-500 mt-1">Histórico clínico de todos os pacientes atendidos.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nome ou número..."
            className="input-field pl-10 w-full sm:w-64"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum paciente encontrado.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((patient: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MessageCircle className="w-3 h-3 text-green-500" />
                    {patient.phone}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {patient.last_visit && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Última Consulta</p>
                      <p className="text-sm font-semibold text-gray-700">{format(parseISO(patient.last_visit), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  )}
                  <button 
                    onClick={() => onViewHistory({ name: patient.name, phone: patient.phone })}
                    className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
                  >
                    Ver Histórico
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RescheduleModalInner({
  appt,
  onClose,
  onConfirm
}: {
  appt: any;
  onClose: () => void;
  onConfirm: (date: Date, time: string) => Promise<void>;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rules = [] } = useAvailability(appt.professional_id);
  const { data: blockouts = [] } = useBlockouts(appt.professional_id);
  const { data: settings } = useSettings();
  
  const startDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const { data: dayAppointments = [] } = useAppointments(appt.professional_id, startDateStr, startDateStr);

  const duration = settings?.appointment_duration_minutes || 60; // Assumes default duration if service duration isn't available

  const availableDays = rules.map((r: any) => r.day_of_week);

  const timeSlots = (() => {
    if (!selectedDate) return [];
    const rule = rules.find((r: any) => r.day_of_week === selectedDate.getDay());
    if (!rule) return [];

    const slots: string[] = [];
    const [startH, startM] = rule.start_time.split(':').map(Number);
    const [endH, endM] = rule.end_time.split(':').map(Number);
    
    let currentSlot = setMinutes(setHours(selectedDate, startH), startM);
    const endTime = setMinutes(setHours(selectedDate, endH), endM);
    
    // Minimum notice buffer: appointments must be at least 'duration' minutes in the future
    const nowWithBuffer = new Date();
    nowWithBuffer.setMinutes(nowWithBuffer.getMinutes() + duration);

    while (currentSlot.getTime() + duration * 60000 <= endTime.getTime() + 1000) {
      const slotStart = currentSlot;
      const slotEnd = new Date(currentSlot.getTime() + duration * 60000);
      
      const hasConflict = dayAppointments.some((da: any) => {
        if (da.status === 'cancelled' || da.id === appt.id) return false;
        return slotStart < parseISO(da.end_time) && slotEnd > parseISO(da.start_time);
      });

      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      const hasBlockout = blockouts.some((b: any) => {
        if (b.date !== selectedDateString) return false;
        const bStart = setMinutes(setHours(selectedDate, parseInt(b.start_time.split(':')[0])), parseInt(b.start_time.split(':')[1]));
        const bEnd = setMinutes(setHours(selectedDate, parseInt(b.end_time.split(':')[0])), parseInt(b.end_time.split(':')[1]));
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!hasConflict && !hasBlockout && slotStart >= nowWithBuffer) {
        slots.push(format(currentSlot, 'HH:mm'));
      }
      currentSlot = new Date(currentSlot.getTime() + duration * 60000);
    }
    return slots;
  })();

  const weekDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    await onConfirm(selectedDate, selectedTime);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 mb-6">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">1. Selecione a Nova Data</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {weekDays.map((date, i) => {
            const isAvailable = availableDays.includes(date.getDay());
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            return (
              <button
                key={i}
                type="button"
                disabled={!isAvailable}
                onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                className={`snap-center min-w-[4rem] p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${!isAvailable ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}
              >
                <span className="text-[10px] uppercase font-bold mb-1 opacity-80">{format(date, 'eee', { locale: ptBR })}</span>
                <span className="text-lg font-black">{format(date, 'dd')}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {selectedDate && (
        <div className="animate-fade-in">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">2. Selecione o Novo Horário</label>
          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {timeSlots.map((time, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`p-2 rounded-xl text-sm font-bold border transition-all ${selectedTime === time ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-500 text-sm">
              Nenhum horário disponível.
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime || isSubmitting}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Aguarde...' : 'Confirmar e Avisar'}
        </button>
      </div>
    </div>
  );
}

function UsersTabContent() {
  const { data: currentUser } = useCurrentUser()
  const { data: users = [], isLoading } = useUsers()
  const { data: professionals = [] } = useProfessionals()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'master' | 'clinica' | 'profissional'>('clinica')
  const [professionalId, setProfessionalId] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return toast.error('Preencha os campos.')
    
    try {
      await createUser.mutateAsync({
        username,
        password,
        role,
        professional_id: professionalId || undefined
      })
      toast.success('Usuário criado.')
      setUsername('')
      setPassword('')
      setRole('clinica')
      setProfessionalId('')
    } catch {
      toast.error('Erro ao criar usuário.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja inativar o usuário?')) return
    try {
      await deleteUser.mutateAsync(id)
      toast.success('Usuário inativado.')
    } catch {
      toast.error('Erro.')
    }
  }

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleCreate} className="card space-y-4">
        <h3 className="font-bold text-gray-800">Novo Usuário</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600">Usuário</label>
            <input className="input-field mt-1" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Senha</label>
            <input type="password" className="input-field mt-1" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Nível de Acesso</label>
            <select className="input-field mt-1" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="clinica">Clínica (Recepcionista)</option>
              <option value="profissional">Profissional</option>
              <option value="master">Master</option>
            </select>
          </div>
          {role === 'profissional' && (
            <div>
              <label className="text-xs font-bold text-gray-600">Vincular Profissional</label>
              <select className="input-field mt-1" value={professionalId} onChange={e => setProfessionalId(e.target.value)} required>
                <option value="">Selecione...</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={createUser.isPending} className="btn-primary">
          {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
        </button>
      </form>

      <div className="card space-y-4">
        <h3 className="font-bold text-gray-800">Usuários Cadastrados</h3>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-gray-800">{u.username}</p>
                <p className="text-xs text-gray-500 uppercase">{u.role}</p>
              </div>
              {currentUser?.id !== u.id && u.username !== 'master' && (
                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-gray-500">Nenhum usuário cadastrado.</p>}
        </div>
      </div>
    </div>
  )
}
