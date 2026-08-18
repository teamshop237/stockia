import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts } from '../lib/products'
import type { Product } from '../types/database'
import { StatCard } from '../components/StatCard'
import { AiAnalysisSection } from '../components/AiAnalysisSection'

export function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listProducts('')
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Impossible de charger les données.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  if (loading) {
    return <p className="text-gray-500">Chargement…</p>
  }

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="mt-4 text-gray-500">
          Aucun produit pour l'instant.{' '}
          <Link to="/products" className="text-blue-600 hover:underline">
            Ajoute ton premier produit
          </Link>{' '}
          pour voir apparaître tes statistiques ici.
        </p>
      </div>
    )
  }

  const totalStockValue = products.reduce((sum, p) => sum + Number(p.quantity) * Number(p.price), 0)
  const lowStockProducts = products
    .filter((p) => Number(p.quantity) <= Number(p.alert_threshold))
    .sort(
      (a, b) =>
        Number(a.quantity) - Number(a.alert_threshold) - (Number(b.quantity) - Number(b.alert_threshold)),
    )

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total produits" value={String(products.length)} />
        <StatCard label="Valeur totale du stock" value={totalStockValue.toFixed(2)} />
        <StatCard
          label="Produits sous le seuil d'alerte"
          value={String(lowStockProducts.length)}
          accent={lowStockProducts.length > 0}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">À réapprovisionner</h2>
        {lowStockProducts.length === 0 ? (
          <p className="mt-2 text-gray-500">Aucun produit sous son seuil d'alerte.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Nom</th>
                  <th className="py-2 pr-4 font-medium">Quantité</th>
                  <th className="py-2 pr-4 font-medium">Seuil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="bg-red-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 pr-4 font-semibold text-red-700">{Number(p.quantity)}</td>
                    <td className="py-2 pr-4 text-gray-600">{Number(p.alert_threshold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AiAnalysisSection />
    </div>
  )
}
