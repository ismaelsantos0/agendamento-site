import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, User as UserIcon, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { register, handleSubmit } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('username', values.username)
      formData.append('password', values.password)

      const { data } = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      localStorage.setItem('@agendamentos:token', data.access_token)
      onLogin()
      toast.success('Acesso liberado!')
    } catch {
      toast.error('Usuário ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Restrito</h1>
          <p className="text-gray-500 text-sm mt-1">Clínica Vida - Painel Gestor</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div className="relative">
            <UserIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input placeholder="Usuário" className="input-field pl-12" {...register('username', { required: true })} />
          </div>
          
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="password" placeholder="Senha" className="input-field pl-12" {...register('password', { required: true })} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
