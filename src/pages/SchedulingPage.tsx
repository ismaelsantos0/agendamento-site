import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, User, Phone, ChevronRight } from 'lucide-react';

interface SchedulingPageProps {
  specialist?: string;
  specialistName?: string;
  scheduledDate?: string;
  availability?: {
    hasSlots: boolean;
    duration: number;
    message?: string;
  };
}

export default function SchedulingPage({
  specialist = 'Especialista',
  specialistName = 'DR Nikolas',
  scheduledDate = '20',
  availability = {
    hasSlots: false,
    duration: 90,
    message: 'Dr(a). não atende ou não tem vagas neste dia.'
  }
}: SchedulingPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const weekDays = [
    { label: 'DOMINGO', number: 21 },
    { label: 'SEGUNDA', number: 22 },
    { label: 'TERÇA', number: 23 },
    { label: 'QUARTA', number: 24 },
    { label: 'QUINTA', number: 25 },
    { label: 'SEXTA', number: 26 }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">{specialist}</h1>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden mb-8">
          {/* Specialist Name Section */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <p className="text-sm font-semibold text-teal-700">{specialistName}</p>
          </div>

          {/* Calendar Section */}
          <div className="px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Agenda de {specialistName}
                </h2>
                <button className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1">
                  Ver Mês <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Date Card */}
              <div className="mb-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-xs font-semibold opacity-90 mb-1">SELECIONADO</p>
                <p className="text-4xl font-bold">{scheduledDate}</p>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {weekDays.map((day, idx) => (
                  <button
                    key={idx}
                    className={`py-3 px-2 rounded-lg text-center transition-all duration-200 ${
                      idx === 0
                        ? 'bg-slate-100 border-2 border-slate-300'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500 mb-1">{day.label}</p>
                    <p className={`text-sm font-semibold ${idx === 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                      {day.number}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Info */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Sem vagas disponíveis</p>
                  <p className="text-sm text-red-700">{availability.message}</p>
                </div>
              </div>
            </div>

            {/* Duration Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
              <Clock className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">Duração:</span> {availability.duration} minutos
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
          disabled={!availability.hasSlots || !formData.name || !formData.phone}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            availability.hasSlots && formData.name && formData.phone
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-teal-700 active:scale-95'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-5 h-5" />
          Confirmar Agendamento
        </button>

        {/* Helper Text */}
        {(!formData.name || !formData.phone) && (
          <p className="text-center text-sm text-slate-600 mt-4">
            Preencha seus dados para continuar
          </p>
        )}

        {!availability.hasSlots && (
          <p className="text-center text-sm text-red-600 mt-4">
            Nenhuma vaga disponível para esta data
          </p>
        )}
      </div>
    </div>
  );
}
