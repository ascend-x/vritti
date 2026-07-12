import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import FuelExpenses from './pages/FuelExpenses'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import TripTracking from './pages/TripTracking'
import RouteOptimizer from './pages/RouteOptimizer'
import AuditLog from './pages/AuditLog'
import Leaderboard from './pages/Leaderboard'
import CarbonFootprint from './pages/CarbonFootprint'
import KanbanBoard from './pages/KanbanBoard'

function ProtectedRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const user = useAuthStore(s => s.user)
  const addNotification = useNotificationStore(s => s.addNotification)

  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
    const socket = io(socketUrl, { withCredentials: true });
    
    socket.on('trip_update', (data) => {
      toast(data.message, { icon: '⚡', duration: 5000, style: { background: '#10b981', color: '#fff' } });
      addNotification({ type: 'trip', title: 'Trip Update', message: data.message });
    });

    return () => socket.disconnect();
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:id" element={<TripTracking />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<FuelExpenses />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/optimizer" element={<RouteOptimizer />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/carbon" element={<CarbonFootprint />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
