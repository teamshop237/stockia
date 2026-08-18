import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function GuestRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (session && profile) {
    return <Navigate to="/dashboard" replace />
  }

  if (session && !profile) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
