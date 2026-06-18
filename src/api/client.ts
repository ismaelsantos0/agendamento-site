import axios from 'axios'

// Configure aqui a URL base da sua API no Railway
export const api = axios.create({
  baseURL: 'https://agendamentos01-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar o token JWT nas chamadas caso o usuário esteja logado (admin)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@agendamentos:token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
