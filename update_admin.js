const fs = require('fs');

const file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('{/* Form: Configurações */}');
const endIdx = content.indexOf('{showAppointmentsTab && (');

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find blocks");
    process.exit(1);
}

const newSettingsBlock = `{/* Painel Central de Configurações */}
        {showSettingsForm && (
          <div className="card animate-fade-in space-y-6 border border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200">
              <Settings className="w-5 h-5 text-gray-500" />
              Central de Configurações
            </h2>

            {/* Abas Internas */}
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full overflow-x-auto">
              <button onClick={() => setActiveSettingsTab('company')} className={\`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all \${activeSettingsTab === 'company' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>Dados da Empresa</button>
              <button onClick={() => setActiveSettingsTab('general')} className={\`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all \${activeSettingsTab === 'general' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>Gerais</button>
              <button onClick={() => setActiveSettingsTab('whatsapp')} className={\`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all \${activeSettingsTab === 'whatsapp' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>WhatsApp & Mensagens</button>
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
`;

const oldWhatsappContent = content.substring(content.indexOf('{showWhatsAppTab && (') + '{showWhatsAppTab && ('.length, endIdx).trim();

// Use regex to extract inner content
const innerMatch = oldWhatsappContent.match(/<div className="space-y-6 animate-fade-in">([\s\S]*?)<\/div>\s*\)\}\s*$/);
if (innerMatch) {
    const innerWhatsapp = innerMatch[1].trim();
    const whatsappSection = \`              <div className="space-y-6 animate-fade-in">
                \${innerWhatsapp}
              </div>
            )}
          </div>
        )}

        \`;

    const newContent = content.substring(0, startIdx) + newSettingsBlock + whatsappSection + content.substring(endIdx);
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Success");
} else {
    console.log("Regex failed");
}
