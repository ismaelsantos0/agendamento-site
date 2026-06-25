import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, User, Phone, CheckCircle2, ChevronDown, ClipboardList, UserPlus } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { useParams } from 'react-router-dom';
import { useProfessionals, useProfessionalBySlug, useAvailability, useAppointments, useCreateAppointment, useSettings, useBlockouts, useSendOtp, useServices } from '../hooks/useAppointments';

export default function SchedulingPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: professionals = [], isLoading: loadingProfs } = useProfessionals();
  const { data: profBySlug } = useProfessionalBySlug(slug);
  const { data: settings } = useSettings();
  const { data: dbServices = [] } = useServices();
  const createAppointment = useCreateAppointment();
  const sendOtp = useSendOtp();

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [formData, setFormData] = useState({ name: '', phone: '' });



  // Phone masking
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let v = value.replace(/\D/g, '');
      if (!v.startsWith('55') && v.length > 0) v = '55' + v;
      let masked = v;
      if (v.length > 2 && v.length <= 4) masked = `${v.slice(0,2)} (${v.slice(2)})`;
      else if (v.length > 4 && v.length <= 9) masked = `${v.slice(0,2)} (${v.slice(2,4)}) ${v.slice(4)}`;
      else if (v.length > 9) masked = `${v.slice(0,2)} (${v.slice(2,4)}) ${v.slice(4,9)}-${v.slice(9,13)}`;
      setFormData(prev => ({ ...prev, phone: masked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const { data: rules = [] } = useAvailability(selectedProfId);
  const { data: blockouts = [] } = useBlockouts(selectedProfId);
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
  const { data: dayAppointments = [] } = useAppointments(selectedProfId, dateStr);

  const availableServices = useMemo(() => {
    return dbServices;
  }, [dbServices]);

  const filteredProfessionals = useMemo(() => {
    if (profBySlug) return [profBySlug];
    
    // Hide custom link professionals from the general clinic hub
    // EXCETO se for uma clínica Solo (apenas 1 profissional no sistema), para evitar que o hub fique vazio
    let validProfs = professionals;
    if (!slug && professionals.length > 1) {
      validProfs = professionals.filter(p => !p.has_custom_link);
    }
    
    if (!selectedService || availableServices.length === 0) return validProfs;
    const svc = availableServices.find(s => s.name === selectedService);
    if (!svc || !svc.professional_ids || svc.professional_ids.length === 0) {
      return validProfs;
    }
    return validProfs.filter(p => svc.professional_ids!.includes(p.id));
  }, [professionals, selectedService, availableServices, profBySlug, slug]);

  // Autoselect professional or reset if current selection is invalid
  useEffect(() => {
    if (profBySlug) {
      setSelectedProfId(profBySlug.id);
      return;
    }
    if (filteredProfessionals.length > 0) {
      const isValid = filteredProfessionals.some(p => p.id === selectedProfId);
      if (!isValid) {
        setSelectedProfId(filteredProfessionals[0].id);
        setSelectedTime(''); // Reset time if prof changes
      }
    } else {
      setSelectedProfId('');
    }
  }, [filteredProfessionals, selectedProfId, profBySlug]);

  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  }, []);

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedProfId) return [];
    if (availableServices.length > 0 && !selectedService) return [];
    const rule = rules.find(r => r.day_of_week === selectedDate.getDay());
    if (!rule) return [];

    const slots: string[] = [];
    const [startH, startM] = rule.start_time.split(':').map(Number);
    const [endH, endM] = rule.end_time.split(':').map(Number);
    
    let currentSlot = setMinutes(setHours(selectedDate, startH), startM);
    const endTime = setMinutes(setHours(selectedDate, endH), endM);
    
    let duration = settings?.appointment_duration_minutes || 60;
    if (selectedService && availableServices.length > 0) {
      const svc = availableServices.find(s => s.name === selectedService);
      if (svc && svc.duration_minutes) {
        duration = svc.duration_minutes;
      }
    }
    
    // Minimum notice buffer: appointments must be at least 'duration' minutes in the future
    const nowWithBuffer = addMinutes(new Date(), duration);

    while (addMinutes(currentSlot, duration) <= endTime) {
      const slotStart = currentSlot;
      const slotEnd = addMinutes(currentSlot, duration);
      
      const hasConflict = dayAppointments.some(appt => {
        if (appt.status === 'cancelled') return false;
        return slotStart < parseISO(appt.end_time) && slotEnd > parseISO(appt.start_time);
      });

      const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
      const hasBlockout = blockouts.some(b => {
        if (b.date !== selectedDateString) return false;
        const bStart = setMinutes(setHours(selectedDate, parseInt(b.start_time.split(':')[0])), parseInt(b.start_time.split(':')[1]));
        const bEnd = setMinutes(setHours(selectedDate, parseInt(b.end_time.split(':')[0])), parseInt(b.end_time.split(':')[1]));
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!hasConflict && !hasBlockout && slotStart >= nowWithBuffer) {
        slots.push(format(currentSlot, 'HH:mm'));
      }
      currentSlot = addMinutes(currentSlot, duration);
    }
    return slots;
  }, [selectedDate, selectedProfId, selectedService, availableServices, rules, dayAppointments, settings, blockouts]);

  const handleSendOtp = async () => {
    if (availableServices.length > 0 && !selectedService) {
      toast.error('Selecione um serviço.');
      return;
    }
    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error('Preencha todos os campos.');
      return;
    }
    
    try {
      await sendOtp.mutateAsync({
        customer_phone: formData.phone.replace(/\D/g, ''),
        customer_name: formData.name,
        professional_id: selectedProfId
      });
      setOtpSent(true);
      toast.success('Código enviado para o seu WhatsApp!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao enviar código. Verifique seu número e limites.');
    }
  };

  const handleConfirmOtp = async () => {
    if (!otpCode || otpCode.length !== 4) {
      toast.error('Digite o código de 4 dígitos.');
      return;
    }

    if (!selectedDate) {
      toast.error('Selecione uma data.');
      return;
    }

    const [h, m] = selectedTime.split(':').map(Number);
    const startDt = setMinutes(setHours(selectedDate, h), m);

    try {
      await createAppointment.mutateAsync({
        professional_id: selectedProfId,
        customer_name: formData.name,
        customer_phone: formData.phone.replace(/\D/g, ''),
        start_time: startDt.toISOString(),
        otp_code: otpCode,
        service_name: selectedService || undefined
      });
      setSubmitted(true);
      setFormData({ name: '', phone: '' });
      setSelectedTime('');
      setOtpSent(false);
      setOtpCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao solicitar agendamento.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 text-teal-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Consulta Agendada!</h1>
        <p className="text-slate-500 mb-8 max-w-xs">Seu horário de {settings?.appointment_duration_minutes || 60} minutos foi reservado com sucesso. Aguardamos você!</p>
        <button onClick={() => setSubmitted(false)} className="w-full max-w-xs py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 active:scale-95">
          Novo Agendamento
        </button>
      </div>
    );
  }

  const hasSlots = timeSlots.length > 0;
  const isAvailable = selectedDate && rules.some(r => r.day_of_week === selectedDate.getDay());
  const duration = settings?.appointment_duration_minutes || 60;
  const scheduledDateNum = selectedDate ? format(selectedDate, 'dd') : '--';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      {settings?.banner_image_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10 z-10" />
          <img src={settings.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}
      {/* OTP Modal */}
      {otpSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Verificação Segura</h3>
            <p className="text-sm text-slate-600 mb-6">Enviamos um código de 4 dígitos para o número <strong className="text-slate-800">{formData.phone}</strong> pelo WhatsApp.</p>
            <input 
              type="text" 
              maxLength={4}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full text-center text-4xl tracking-[0.5em] font-bold py-4 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none mb-6 transition-all"
            />
            <div className="flex gap-3">
              <button onClick={() => setOtpSent(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button 
                onClick={handleConfirmOtp} 
                disabled={createAppointment.isPending}
                className="flex-1 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-xl transition-colors shadow-lg shadow-teal-600/30"
                style={{ backgroundColor: settings?.primary_color || '#0d9488', boxShadow: `0 10px 15px -3px ${settings?.primary_color || '#0d9488'}40` }}
              >
                {createAppointment.isPending ? 'Validando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${settings?.logo_url ? 'overflow-hidden bg-white' : ''}`}
                style={!settings?.logo_url ? { backgroundColor: settings?.primary_color || '#0d9488', boxShadow: `0 10px 15px -3px ${settings?.primary_color || '#0d9488'}40` } : undefined}
              >
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {profBySlug ? profBySlug.name.substring(0,2).toUpperCase() : (settings?.clinic_name ? settings.clinic_name.substring(0,2).toUpperCase() : 'AG')}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  {profBySlug ? profBySlug.name : (settings?.clinic_name || 'Agendamento')}
                </h1>
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                  {profBySlug ? (profBySlug.profession || 'Especialista') : 'Agendamento Online'}
                </p>
              </div>
            </div>
            
            {/* Redes Sociais */}
            <div className="flex items-center gap-3">
              {settings?.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {settings?.social_whatsapp && (
                <a href={`https://wa.me/${settings.social_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 -mt-2">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              Opções de Atendimento
            </h2>
            
            <div className="space-y-4">
              {/* Services Section */}
              {availableServices.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-1.5 block">Serviço Desejado</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ClipboardList className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <select 
                      value={selectedService} 
                      onChange={e => { setSelectedService(e.target.value); setSelectedTime(''); }}
                      className="block w-full pl-10 pr-10 py-3.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <option value="">Selecione um serviço...</option>
                      {availableServices.map(s => (
                        <option key={s.id} value={s.name}>{s.name} {s.price ? `- ${s.price}` : ''}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                  </div>
                </div>
              )}

              {/* Specialist Name Section */}
              {!slug && (
                <div className="animate-fade-in">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1 mb-2 block">Especialista</label>
                  
                  {loadingProfs ? (
                    <div className="h-[72px] bg-slate-100 rounded-2xl animate-pulse w-full border border-slate-200" />
                  ) : filteredProfessionals.length === 1 ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-teal-500/20 transition-all pointer-events-none"></div>
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-teal-600 font-bold text-lg border border-teal-100 shadow-sm shrink-0 z-10">
                        {filteredProfessionals[0].name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="z-10">
                        <h3 className="font-extrabold text-slate-800 text-sm">{filteredProfessionals[0].name}</h3>
                        <p className="text-[10px] font-bold text-teal-600/80 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> Selecionado
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <UserPlus className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                      </div>
                      <select 
                        value={selectedProfId} 
                        onChange={e => { setSelectedProfId(e.target.value); setSelectedTime(''); }}
                        className="block w-full pl-10 pr-10 py-3.5 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl appearance-none outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Escolha o especialista</option>
                        {filteredProfessionals.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Section */}
          <div className="px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Agenda
                </h2>
              </div>

              {/* Selected Date Card */}
              <div className="mb-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-xs font-semibold opacity-90 mb-1">SELECIONADO</p>
                <p className="text-4xl font-bold">{scheduledDateNum} <span className="text-lg font-normal opacity-80">{selectedDate ? format(selectedDate, 'MMMM', { locale: ptBR }) : ''}</span></p>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const available = rules.some(r => r.day_of_week === day.getDay());

                  return (
                    <button
                      key={day.toISOString()}
                      disabled={!available}
                      onClick={() => { setSelectedDate(day); setSelectedTime(''); }}
                      className={`py-3 px-1 rounded-lg text-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-slate-100 border-2 border-slate-300'
                          : available 
                            ? 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                        {format(day, 'dd')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability Info & Time Slots */}
            {selectedDate && !isAvailable && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                 <div className="flex gap-3">
                   <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                   <div>
                     <p className="text-sm font-semibold text-red-900 mb-1">Sem atendimento</p>
                     <p className="text-sm text-red-700">Dr(a). não atende neste dia.</p>
                   </div>
                 </div>
               </div>
            )}

            {selectedDate && isAvailable && !hasSlots && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                 <div className="flex gap-3">
                   <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                   <div>
                     <p className="text-sm font-semibold text-red-900 mb-1">Sem vagas disponíveis</p>
                     <p className="text-sm text-red-700">Todos os horários já foram preenchidos.</p>
                   </div>
                 </div>
               </div>
            )}

            {selectedDate && hasSlots && (
               <div className="mb-8">
                 <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-slate-400" /> Horários Disponíveis
                 </h3>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot} 
                        type="button" 
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedTime === slot 
                            ? 'text-white shadow-md scale-105' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        style={selectedTime === slot ? { backgroundColor: settings?.primary_color || '#0d9488' } : undefined}
                      >
                        {slot}
                      </button>
                    ))}
                 </div>
               </div>
            )}

            {/* Duration Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 mt-4">
              <Clock className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">Duração:</span> {duration} minutos
              </span>
            </div>
          </div>
        </div>

        {/* User Data Section */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Seus dados
            </p>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite seu nome"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-600" />
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Form completion indicator */}
            <div className="flex gap-2 mt-6">
              <div className={`h-2 flex-1 rounded-full transition-colors ${formData.name ? 'bg-teal-500' : 'bg-slate-200'}`} />
              <div className={`h-2 flex-1 rounded-full transition-colors ${formData.phone ? 'bg-teal-500' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleSendOtp}
          disabled={!hasSlots || !formData.name || !formData.phone || !selectedTime || sendOtp.isPending}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            hasSlots && formData.name && formData.phone && selectedTime && !sendOtp.isPending
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 active:scale-95'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-5 h-5" />
          {sendOtp.isPending ? 'Enviando Código...' : 'Agendar (Requer Verificação)'}
        </button>

        {/* Helper Text */}
        {(!formData.name || !formData.phone || !selectedTime) && (
          <p className="text-center text-sm text-slate-600 mt-4">
            {!selectedTime ? 'Selecione um horário' : 'Preencha seus dados para continuar'}
          </p>
        )}

      </div>
    </div>
  );
}
