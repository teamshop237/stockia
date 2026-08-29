import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-gray-900">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/admin/organizations" className="font-semibold text-white">
            StockIA — Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin/organizations" className="text-gray-300 hover:text-white">
              Organisations
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
