import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, User, Phone, CheckCircle2, ChevronDown, ClipboardList, UserPlus } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { useParams } from 'react-router-dom';
import { useProfessionals, useProfessionalBySlug, useAvailability, useAppointments, useCreateAppointment, useSettings, useBlockouts, useSendOtp, useServices } from '../hooks/useAppointments';

const getThemeConfig = (styleId: string | null | undefined, primaryColor: string | null | undefined) => {
  const color = primaryColor || '#0d9488';
  
  let config = {
    wrapperStyle: { backgroundColor: '#f8fafc' } as React.CSSProperties,
    cardClasses: 'bg-white border-slate-200 shadow-md',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-500',
    inputClasses: 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white',
    headerClasses: 'bg-white/80 border-slate-200',
    renderBackgroundElements: () => null as React.ReactNode
  };

  switch (styleId) {
    case 'dark_mode':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#0f172a' },
        cardClasses: 'bg-slate-900 border-slate-800 shadow-2xl',
        textMain: 'text-slate-50',
        textMuted: 'text-slate-400',
        inputClasses: 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-900 placeholder:text-slate-500',
        headerClasses: 'bg-slate-900/80 border-slate-800',
      };
      break;
    case 'glassmorphism':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#f1f5f9', overflow: 'hidden' },
        cardClasses: 'bg-white/40 backdrop-blur-2xl border-white/50 shadow-xl',
        inputClasses: 'bg-white/50 border-white/40 text-slate-900 focus:bg-white/80',
        headerClasses: 'bg-white/30 backdrop-blur-xl border-white/20',
        renderBackgroundElements: () => (
          <>
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none" style={{ backgroundColor: color, zIndex: 0 }} />
            <div className="fixed top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none" style={{ backgroundColor: color, zIndex: 0 }} />
            <div className="fixed bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none" style={{ backgroundColor: color, zIndex: 0 }} />
          </>
        )
      };
      break;
    case 'minimalist':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#fcfcfc', overflow: 'hidden' },
        cardClasses: 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        renderBackgroundElements: () => (
          <div className="fixed top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: color, zIndex: 0 }} />
        )
      };
      break;
    case 'aurora':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#0f172a', overflow: 'hidden' },
        cardClasses: 'bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl',
        textMain: 'text-slate-50',
        textMuted: 'text-slate-300',
        inputClasses: 'bg-white/5 border-white/10 text-slate-100 focus:bg-white/10 placeholder:text-slate-400',
        headerClasses: 'bg-white/5 backdrop-blur-md border-white/10',
        renderBackgroundElements: () => (
          <>
            <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-[100%] mix-blend-screen filter blur-[80px] opacity-40 animate-aurora-flow pointer-events-none" style={{ backgroundColor: color, zIndex: 0 }} />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-[100%] mix-blend-screen filter blur-[80px] opacity-30 animate-aurora-flow animation-delay-4000 pointer-events-none" style={{ backgroundColor: '#8b5cf6', zIndex: 0 }} />
          </>
        )
      };
      break;
    case 'galaxy':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#050510', overflow: 'hidden' },
        cardClasses: 'bg-slate-900/60 backdrop-blur-md border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]',
        textMain: 'text-slate-100',
        textMuted: 'text-slate-400',
        inputClasses: 'bg-slate-800/80 border-slate-700 text-slate-100 focus:bg-slate-800 placeholder:text-slate-500',
        headerClasses: 'bg-slate-900/50 backdrop-blur-md border-slate-800',
        renderBackgroundElements: () => (
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050510] to-[#000000]">
            <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-twinkle"></div>
            <div className="absolute top-[30%] left-[80%] w-1 h-1 bg-white rounded-full animate-twinkle animation-delay-2000"></div>
            <div className="absolute top-[70%] left-[40%] w-2 h-2 bg-white rounded-full animate-twinkle animation-delay-4000 blur-[1px]"></div>
            <div className="absolute top-[50%] left-[10%] w-1 h-1 bg-white rounded-full animate-twinkle delay-300"></div>
            <div className="absolute top-[80%] left-[70%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-twinkle delay-100"></div>
            <div className="absolute top-0 left-[20%] w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-20 -rotate-45 translate-y-[20vh] scale-x-150"></div>
            <div className="absolute top-[10%] left-[50%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-10" style={{ backgroundColor: color }}></div>
          </div>
        )
      };
      break;
    case 'ocean':
      config = {
        ...config,
        wrapperStyle: { backgroundColor: '#f4e4d4', overflow: 'hidden' },
        cardClasses: 'bg-white/80 backdrop-blur-md border-white/50 shadow-xl',
        renderBackgroundElements: () => (
          <div className="fixed inset-0 z-0 pointer-events-none flex flex-col justify-end">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-white to-transparent" />
            <svg className="w-[200%] h-[30vh] opacity-40 animate-wave fill-teal-500/20" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,165.3C960,181,1056,203,1152,186.7C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            <svg className="w-[200%] h-[20vh] opacity-60 animate-wave animation-delay-2000 fill-teal-600/30 -ml-[50%]" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path d="M0,192L48,181.3C96,171,192,149,288,149.3C384,149,480,171,576,186.7C672,203,768,213,864,197.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        )
      };
      break;
    case 'sunset':
      config = {
        ...config,
        wrapperStyle: { background: 'linear-gradient(to bottom, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', overflow: 'hidden' },
        cardClasses: 'bg-white/90 backdrop-blur-sm border-white/50 shadow-xl',
        renderBackgroundElements: () => (
          <div className="fixed inset-0 z-0 pointer-events-none flex flex-col justify-end overflow-hidden">
            <div className="absolute bottom-[10%] left-[50%] -translate-x-1/2 w-64 h-64 bg-orange-400 rounded-full blur-[2px] animate-sun-pulse shadow-[0_0_100px_rgba(251,146,60,0.8)]" />
            <div className="w-full h-[15vh] bg-gradient-to-t from-orange-900/40 to-transparent" />
          </div>
        )
      };
      break;
  }
  return config;
}

export default function SchedulingPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: professionals = [], isLoading: loadingProfs } = useProfessionals();
  const { data: profBySlug } = useProfessionalBySlug(slug);
  const { data: settings } = useSettings();
  const { data: dbServices = [] } = useServices();
  const createAppointment = useCreateAppointment();
  const sendOtp = useSendOtp();
  const theme = getThemeConfig(settings?.background_style, settings?.primary_color);

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
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={theme.wrapperStyle}
      >
        {theme.renderBackgroundElements()}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-6 ${theme.cardClasses}`}>
          <CheckCircle2 className="w-12 h-12" style={{ color: settings?.primary_color || '#0d9488' }} />
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${theme.textMain}`}>Consulta Agendada!</h1>
        <p className={`mb-8 max-w-xs ${theme.textMuted}`}>Seu horário de {settings?.appointment_duration_minutes || 60} minutos foi reservado com sucesso. Aguardamos você!</p>
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
    <div 
      className="min-h-screen pb-12 transition-all duration-500 relative"
      style={theme.wrapperStyle}
    >
      {theme.renderBackgroundElements()}
      {settings?.banner_image_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10 z-10" />
          <img src={settings.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}
      {/* OTP Modal */}
      {otpSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-full max-w-sm shadow-xl ${theme.cardClasses}`}>
            <h3 className={`text-xl font-bold mb-2 ${theme.textMain}`}>Verificação Segura</h3>
            <p className={`text-sm mb-6 ${theme.textMuted}`}>Enviamos um código de 4 dígitos para o número <strong className={theme.textMain}>{formData.phone}</strong> pelo WhatsApp.</p>
            <input 
              type="text" 
              maxLength={4}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className={`w-full text-center text-4xl tracking-[0.5em] font-bold py-4 rounded-xl border-2 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none mb-6 transition-all ${theme.inputClasses}`}
            />
            <div className="flex gap-3">
              <button onClick={() => setOtpSent(false)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${theme.inputClasses}`}>Cancelar</button>
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
      <div className={`sticky top-0 z-20 border-b shadow-sm ${theme.headerClasses}`}>
        <div className="max-w-2xl mx-auto px-5 py-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${settings?.logo_url ? 'overflow-hidden' : ''} ${theme.cardClasses}`}
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
                <h1 className={`text-xl font-extrabold tracking-tight ${theme.textMain}`}>
                  {profBySlug ? profBySlug.name : (settings?.clinic_name || 'Agendamento')}
                </h1>
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider" style={{ color: settings?.primary_color || '#0d9488' }}>
                  {profBySlug ? (profBySlug.profession || 'Especialista') : 'Agendamento Online'}
                </p>
              </div>
            </div>
            
            {/* Redes Sociais */}
            <div className="flex items-center gap-3">
              {settings?.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${theme.inputClasses}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {settings?.social_whatsapp && (
                <a href={`https://wa.me/${settings.social_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${theme.inputClasses}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 -mt-2 animate-fade-in-up delay-100">
        {/* Card Principal */}
        <div className={`rounded-2xl overflow-hidden mb-8 transition-all duration-300 ${theme.cardClasses}`}>
          <div className={`p-6 border-b ${theme.headerClasses}`}>
            <h2 className={`text-lg font-bold mb-5 flex items-center gap-2 ${theme.textMain}`}>
              <ClipboardList className="w-5 h-5" style={{ color: settings?.primary_color || '#0d9488' }} />
              Opções de Atendimento
            </h2>
            
            <div className="space-y-4">
              {/* Services Section */}
              {availableServices.length > 0 && (
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wide ml-1 mb-1.5 block ${theme.textMuted}`}>Serviço Desejado</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ClipboardList className={`h-4 w-4 transition-colors ${theme.textMuted}`} />
                    </div>
                    <select 
                      value={selectedService} 
                      onChange={e => { setSelectedService(e.target.value); setSelectedTime(''); }}
                      className={`block w-full pl-10 pr-10 py-3.5 text-sm font-semibold rounded-xl appearance-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer ${theme.inputClasses}`}
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
                  <label className={`text-[11px] font-bold uppercase tracking-wide ml-1 mb-2 block ${theme.textMuted}`}>Especialista</label>
                  
                  {loadingProfs ? (
                    <div className={`h-[72px] rounded-2xl animate-pulse w-full border ${theme.inputClasses}`} />
                  ) : filteredProfessionals.length === 1 ? (
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${theme.inputClasses}`}>
                      <div className="absolute right-0 top-0 w-32 h-32 rounded-full -mr-8 -mt-8 blur-2xl opacity-20 transition-all pointer-events-none" style={{ backgroundColor: settings?.primary_color || '#0d9488' }}></div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0 z-10" style={{ color: settings?.primary_color || '#0d9488', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                        {filteredProfessionals[0].name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="z-10">
                        <h3 className={`font-extrabold text-sm ${theme.textMain}`}>{filteredProfessionals[0].name}</h3>
                        <p className="text-[10px] font-bold text-teal-600/80 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3" /> Selecionado
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <UserPlus className={`h-4 w-4 transition-colors ${theme.textMuted}`} />
                      </div>
                      <select 
                        value={selectedProfId} 
                        onChange={e => { setSelectedProfId(e.target.value); setSelectedTime(''); }}
                        className={`block w-full pl-10 pr-10 py-3.5 text-sm font-semibold rounded-xl appearance-none outline-none focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer ${theme.inputClasses}`}
                      >
                        <option value="" disabled>Escolha o especialista</option>
                        {filteredProfessionals.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <ChevronDown className={`h-4 w-4 transition-colors ${theme.textMuted}`} />
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
                <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.textMain}`}>
                  <Calendar className="w-5 h-5" style={{ color: settings?.primary_color || '#0d9488' }} />
                  Agenda
                </h2>
              </div>

              {/* Selected Date Card */}
              <div className="mb-6 rounded-xl p-4 text-white shadow-lg" style={{ backgroundColor: settings?.primary_color || '#0d9488' }}>
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
                          ? `border-2 opacity-100 ${theme.inputClasses}`
                          : available 
                            ? `opacity-90 hover:opacity-100 ${theme.inputClasses}`
                            : `opacity-30 cursor-not-allowed ${theme.inputClasses}`
                      }`}
                      style={isSelected ? { borderColor: settings?.primary_color || '#0d9488' } : undefined}
                    >
                      <p className={`text-[10px] font-semibold mb-1 uppercase ${theme.textMuted}`}>{format(day, 'EEE', { locale: ptBR })}</p>
                      <p className={`text-sm font-semibold ${isSelected ? theme.textMain : theme.textMuted}`}>
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
               <div className="mb-8 animate-fade-in-up">
                 <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme.textMain}`}>
                   <Clock className="w-4 h-4 opacity-70" /> Horários Disponíveis
                 </h3>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot} 
                        type="button" 
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                          selectedTime === slot 
                            ? 'text-white shadow-md scale-105 border-transparent' 
                            : `hover:opacity-100 opacity-90 ${theme.inputClasses}`
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mt-4 ${theme.inputClasses}`}>
              <Clock className={`w-5 h-5 ${theme.textMuted}`} />
              <span className={`text-sm ${theme.textMain}`}>
                <span className="font-semibold">Duração:</span> {duration} minutos
              </span>
            </div>
          </div>
        </div>

        {/* User Data Section */}
        <div className={`rounded-2xl overflow-hidden mb-8 transition-all duration-300 animate-fade-in-up delay-200 ${theme.cardClasses}`}>
          <div className={`px-6 py-4 border-b ${theme.headerClasses}`}>
            <p className={`text-sm font-semibold flex items-center gap-2 ${theme.textMain}`}>
              <User className="w-4 h-4" />
              Seus dados
            </p>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Full Name Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${theme.textMain}`}>
                Nome completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Digite seu nome"
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all ${theme.inputClasses}`}
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${theme.textMain}`}>
                <Phone className={`w-4 h-4 ${theme.textMuted}`} />
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all ${theme.inputClasses}`}
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
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 animate-fade-in-up delay-300 ${
            hasSlots && formData.name && formData.phone && selectedTime && !sendOtp.isPending
              ? 'text-white shadow-lg hover:shadow-xl active:scale-95'
              : 'opacity-50 cursor-not-allowed bg-slate-300/50 text-slate-500 border border-slate-400/20'
          }`}
          style={hasSlots && formData.name && formData.phone && selectedTime && !sendOtp.isPending ? { backgroundColor: settings?.primary_color || '#0d9488' } : undefined}
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
