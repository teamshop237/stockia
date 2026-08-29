import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const navigate = useNavigate()
  const { session, profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold text-gray-900">
            StockIA
          </Link>
          {session && profile ? (
            <div className="flex items-center gap-4 text-sm">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Tableau de bord
              </Link>
              <Link to="/products" className="text-gray-600 hover:text-gray-900">
                Produits
              </Link>
              <Link to="/team" className="text-gray-600 hover:text-gray-900">
                Équipe
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Connexion
              </Link>
              <Link to="/signup" className="text-gray-600 hover:text-gray-900">
                Créer un compte
              </Link>
            </div>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
