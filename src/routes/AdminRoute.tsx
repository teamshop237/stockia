import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isPlatformAdmin } from '../lib/admin'

export function AdminRoute() {
  const { session, loading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!session) {
      setChecking(false)
      return
    }

    let active = true
    isPlatformAdmin()
      .then((result) => {
        if (active) setIsAdmin(result)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [session, loading])

  if (loading || checking) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
