import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
