import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { format, addMinutes, setHours, setMinutes, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useProfessionals, useAvailability, useAppointments, useCreateAppointment, useSettings, useBlockouts } from '../hooks/useAppointments'
import { CreateAppointmentPayload } from '../types'

export default function PublicBooking() {
  const { data: professionals = [], isLoading: loadingProfs } = useProfessionals()
  const { data: settings } = useSettings()
  const createAppointment = useCreateAppointment()

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [showMonthView, setShowMonthView] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, watch, reset } = useForm<CreateAppointmentPayload>()
  const selectedProfId = watch('professional_id')
  const selectedProf = professionals.find(p => p.id === selectedProfId)
  
  const { data: rules = [] } = useAvailability(selectedProfId)
  const { data: blockouts = [] } = useBlockouts(selectedProfId)
  
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
  const { data: dayAppointments = [] } = useAppointments(selectedProfId, dateStr)

  // ─── Lógica Semanal ────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i))
  }, [])

  // ─── Lógica de Slots Fixos ──────────────────────────────────────────
  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedProfId) return []
    const rule = rules.find(r => r.day_of_week === selectedDate.getDay())
    if (!rule) return []

    const slots: string[] = []
    const [startH, startM] = rule.start_time.split(':').map(Number)
    const [endH, endM] = rule.end_time.split(':').map(Number)
    
    let currentSlot = setMinutes(setHours(selectedDate, startH), startM)
    const endTime = setMinutes(setHours(selectedDate, endH), endM)
    const duration = settings?.appointment_duration_minutes || 60 // Duração dinâmica

    while (addMinutes(currentSlot, duration) <= endTime) {
      const slotStart = currentSlot
      const slotEnd = addMinutes(currentSlot, duration)
      
      const hasConflict = dayAppointments.some(appt => {
        if (appt.status === 'cancelled') return false
        return slotStart < parseISO(appt.end_time) && slotEnd > parseISO(appt.start_time)
      })

      const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
      const hasBlockout = blockouts.some(b => {
        if (b.date !== selectedDateString) return false
        const bStart = setMinutes(setHours(selectedDate, parseInt(b.start_time.split(':')[0])), parseInt(b.start_time.split(':')[1]))
        const bEnd = setMinutes(setHours(selectedDate, parseInt(b.end_time.split(':')[0])), parseInt(b.end_time.split(':')[1]))
        return slotStart < bEnd && slotEnd > bStart
      })

      if (!hasConflict && !hasBlockout) slots.push(format(currentSlot, 'HH:mm'))
      currentSlot = addMinutes(currentSlot, duration)
    }
    return slots
  }, [selectedDate, selectedProfId, rules, dayAppointments, settings, blockouts])

  const onSubmit = async (values: CreateAppointmentPayload) => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário.')
      return
    }

    const [h, m] = selectedTime.split(':').map(Number)
    const startDt = setMinutes(setHours(selectedDate, h), m)

    try {
      await createAppointment.mutateAsync({
        ...values,
        start_time: startDt.toISOString()
      })
      setSubmitted(true)
      reset()
    } catch (err) {
      toast.error('Erro ao solicitar agendamento.')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary-light/30 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 text-primary">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta Agendada!</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Seu horário de 1 hora foi reservado com sucesso. Aguardamos você!</p>
        <button onClick={() => setSubmitted(false)} className="btn-secondary w-full max-w-xs">
          Novo Agendamento
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-primary text-white pt-12 pb-6 px-6 rounded-b-[2rem] shadow-md shadow-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Clínica Vida</h1>
            <p className="text-white/80 text-sm">Agende sua consulta ({settings?.appointment_duration_minutes || 60}m)</p>
          </div>
        </div>
      </header>

      <main className="px-5 mt-[-1rem] relative z-10 space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Card: Profissional */}
          <div className="card space-y-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Especialista
            </h2>
            {loadingProfs ? (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <select className="input-field" {...register('professional_id', { required: true })}>
                <option value="">Selecione o profissional...</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Card: Tabela Semanal de Horários (Só aparece após selecionar prof) */}
          {selectedProfId && (
            <div className="card space-y-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Agenda de {selectedProf?.name}
                </h2>
                <button 
                  type="button" 
                  onClick={() => setShowMonthView(!showMonthView)}
                  className="text-xs text-primary font-bold flex items-center"
                >
                  {showMonthView ? 'Ver Semana' : 'Ver Mês'} <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {showMonthView ? (
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(d) => { setSelectedDate(d); setSelectedTime(''); }}
                    minDate={new Date()}
                    locale={ptBR}
                    inline
                    filterDate={(date) => rules.some(r => r.day_of_week === date.getDay())}
                  />
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {weekDays.map(day => {
                    const isSelected = selectedDate?.toDateString() === day.toDateString()
                    const isAvailable = rules.some(r => r.day_of_week === day.getDay())
                    
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => { setSelectedDate(day); setSelectedTime(''); }}
                        className={`min-w-[4.5rem] flex flex-col items-center p-3 rounded-2xl snap-center transition-all ${isSelected ? 'bg-primary text-white shadow-md' : isAvailable ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-300 opacity-50 cursor-not-allowed'}`}
                      >
                        <span className="text-xs font-semibold uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
                        <span className="text-xl font-bold mt-1">{format(day, 'dd')}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              
              {selectedDate && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1"><Clock className="w-3 h-3"/> Horários de {settings?.appointment_duration_minutes || 60}m</h3>
                  {timeSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(slot => (
                        <button
                          key={slot} type="button" onClick={() => setSelectedTime(slot)}
                          className={`py-3 rounded-xl text-sm font-medium transition-colors ${selectedTime === slot ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">Dr(a). não atende ou não tem vagas neste dia.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card: Dados */}
          <div className="card space-y-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Seus Dados
            </h2>
            <input placeholder="Nome completo" className="input-field" {...register('customer_name', { required: true })} />
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="tel" placeholder="Seu WhatsApp" className="input-field pl-11" {...register('customer_phone', { required: true })} />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={createAppointment.isPending} className="btn-primary">
              {createAppointment.isPending ? 'Enviando...' : `Confirmar Agendamento de ${settings?.appointment_duration_minutes || 60}m`}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
