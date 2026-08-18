import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Page introuvable</h1>
      <Link to="/" className="mt-2 inline-block text-blue-600 hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
