const fs = require('fs');

const file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add new imports for types
content = content.replace(
  "import { Appointment } from '../types'",
  "import { Appointment, AddressInfo, WeeklySchedule } from '../types'"
);

// Replace simple state definitions with structured states
const oldStates = `  const [msgFeedbackCancelled, setMsgFeedbackCancelled] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [address, setAddress] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  
  // Estados de Abas da Central de Configurações`;

const newStates = `  const [msgFeedbackCancelled, setMsgFeedbackCancelled] = useState('')
  const [clinicName, setClinicName] = useState('')
  
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
  
  // Estados de Abas da Central de Configurações`;

content = content.replace(oldStates, newStates);

// Replace useEffect parsing
const oldUseEffect = `      setMsgFeedbackCancelled(settings.msg_feedback_cancelled || '')
      setClinicName(settings.clinic_name || '')
      setAddress(settings.address || '')
      setOpeningHours(settings.opening_hours || '')
    }
  }, [settings])`;

const newUseEffect = `      setMsgFeedbackCancelled(settings.msg_feedback_cancelled || '')
      setClinicName(settings.clinic_name || '')
      try {
        if (settings.address) setAddressInfo(JSON.parse(settings.address))
      } catch { /* legacy string */ }
      try {
        if (settings.opening_hours) setWeeklySchedule(JSON.parse(settings.opening_hours))
      } catch { /* legacy string */ }
    }
  }, [settings])

  const buscarCep = async () => {
    const cepNumbers = addressInfo.cep.replace(/\\D/g, '')
    if (cepNumbers.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(\`https://viacep.com.br/ws/\${cepNumbers}/json/\`)
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
  }`;

content = content.replace(oldUseEffect, newUseEffect);

// Replace handleSaveSettings payload
const oldPayload = `        appointment_duration_minutes: minutes,
        clinic_name: clinicName,
        address: address,
        opening_hours: openingHours,
        msg_created: msgCreated.trim() || undefined,`;

const newPayload = `        appointment_duration_minutes: minutes,
        clinic_name: clinicName,
        address: JSON.stringify(addressInfo),
        opening_hours: JSON.stringify(weeklySchedule),
        msg_created: msgCreated.trim() || undefined,`;

content = content.replace(oldPayload, newPayload);

// Replace the UI inside the form
// We'll just replace the entire `activeSettingsTab === 'company'` block.
const companyTabStart = `{activeSettingsTab === 'company' && (`;
const companyTabEnd = `            {activeSettingsTab === 'general' && (`;

if (content.includes(companyTabStart) && content.includes(companyTabEnd)) {
  const startIdx = content.indexOf(companyTabStart);
  const endIdx = content.indexOf(companyTabEnd);

  const newCompanyTab = `{activeSettingsTab === 'company' && (
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
                    <input className="input-field border-blue-100 bg-blue-50/30" value={addressInfo.mapsLink} onChange={e => setAddressInfo({...addressInfo, mapsLink: e.target.value})} placeholder="Cole o link de compartilhamento do Google Maps aqui" />
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
                              className={\`w-10 h-6 rounded-full transition-colors relative \${sched.isOpen ? 'bg-primary' : 'bg-gray-300'}\`}
                            >
                              <div className={\`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform \${sched.isOpen ? 'right-1' : 'left-1'}\`} />
                            </button>
                            <span className={\`text-xs font-bold \${sched.isOpen ? 'text-gray-800' : 'text-gray-400'}\`}>{dayLabel}</span>
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

            `;
  
  content = content.substring(0, startIdx) + newCompanyTab + content.substring(endIdx);
} else {
  console.log("Could not find company tab");
  process.exit(1);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Success");
