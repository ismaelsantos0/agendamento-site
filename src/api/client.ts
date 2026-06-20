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

// Interceptor para deslogar caso o token tenha expirado (401)
// Só recarrega se havia um token válido antes (evita loop infinito de reload)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = localStorage.getItem('@agendamentos:token')
      localStorage.removeItem('@agendamentos:token')
      if (hadToken) {
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)
