import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SchedulingPage from './pages/SchedulingPage'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SchedulingPage />} />
        <Route path="/agendar/:slug" element={<SchedulingPage />} />
        <Route path="/:slug" element={<SchedulingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
