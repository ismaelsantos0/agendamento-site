import re

with open('src/pages/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the 5 buttons with 4 buttons
old_buttons = """          <button onClick={() => { setShowAppointmentsTab(!showAppointmentsTab); setShowProfForm(false); setShowRuleForm(false); setShowSettingsForm(false); }} className={`flex-1 min-w-[120px] flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border font-medium text-sm transition-all ${showAppointmentsTab ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
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
          </button>"""

# Find the start of `{/* Form: Configurações */}`
start_idx = content.find("{/* Form: Configurações */}")
end_idx = content.find("{showAppointmentsTab && (")

if start_idx == -1 or end_idx == -1:
    print("Could not find blocks")
    exit(1)

new_settings_block = """{/* Painel Central de Configurações */}
        {showSettingsForm && (
          <div className="card animate-fade-in space-y-6 border border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200">
              <Settings className="w-5 h-5 text-gray-500" />
              Central de Configurações
            </h2>

            {/* Abas Internas */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full overflow-x-auto">
              <button onClick={() => setActiveSettingsTab('company')} className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'company' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dados da Empresa</button>
              <button onClick={() => setActiveSettingsTab('general')} className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'general' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Gerais</button>
              <button onClick={() => setActiveSettingsTab('whatsapp')} className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSettingsTab === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>WhatsApp & Mensagens</button>
            </div>

            {/* Conteúdo das Abas */}
            
            {activeSettingsTab === 'company' && (
              <form onSubmit={handleSaveSettings} className="space-y-4 animate-fade-in bg-white p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 text-sm">Dados da Clínica</h3>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Nome da Clínica / Empresa</label>
                  <input className="input-field" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Ex: Clínica Saúde Ideal" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Endereço Completo</label>
                  <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 block">Horário de Funcionamento</label>
                  <input className="input-field" value={openingHours} onChange={e => setOpeningHours(e.target.value)} placeholder="Ex: Seg a Sex, das 08:00 às 18:00" />
                </div>
                <button disabled={updateSettings.isPending} type="submit" className="btn-primary w-full sm:w-auto py-2 text-xs mt-2">
                  {updateSettings.isPending ? 'Salvando...' : 'Salvar Dados'}
                </button>
              </form>
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
                <button disabled={updateSettings.isPending} type="submit" className="btn-primary bg-gray-800 hover:bg-gray-900 w-full sm:w-auto py-2 text-xs mt-2">
                  {updateSettings.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </form>
            )}

            {activeSettingsTab === 'whatsapp' && (
"""

old_whatsapp_content = content[content.find("{showWhatsAppTab && (") + len("{showWhatsAppTab && ("):end_idx].strip()
# Remove the wrapping `          <div className="space-y-6 animate-fade-in">`
# and the matching `          </div>`
# and `)}`
# Wait, let's just use regex to extract the inner content
inner_whatsapp_match = re.search(r'<div className="space-y-6 animate-fade-in">(.*)</div>\s*\)\}\s*$', old_whatsapp_content, re.DOTALL)
if inner_whatsapp_match:
    inner_whatsapp = inner_whatsapp_match.group(1).strip()
    # Need to add type="button" to buttons inside inner_whatsapp to prevent them from submitting any forms if they are inside forms
    # Actually, they are NOT inside forms, except the last one which is explicitly `<form onSubmit={handleSaveSettings}`.
    # We can just keep the exact inner_whatsapp string and append `)}` for the `activeSettingsTab === 'whatsapp' && (` block.
    
    # Wait, inner_whatsapp has a `<form>` at the end. That's fine!
    whatsapp_section = f"""              <div className="space-y-6 animate-fade-in">
                {inner_whatsapp}
              </div>
            )}
          </div>
        )}

        """

    new_content = content[:start_idx] + new_settings_block + whatsapp_section + content[end_idx:]
    with open('src/pages/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Regex failed")
