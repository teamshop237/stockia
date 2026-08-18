import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listProducts, createProduct, updateProduct, deleteProduct } from '../lib/products'
import type { Product, ProductInput } from '../types/database'
import { ProductFormModal } from '../components/ProductFormModal'
import { ConfirmDialog } from '../components/ConfirmDialog'

function byName(a: Product, b: Product) {
  return a.name.localeCompare(b.name)
}

export function ProductsPage() {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const requestId = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    listProducts(search)
      .then((data) => {
        if (id !== requestId.current) return
        setProducts(data)
      })
      .catch((err) => {
        if (id !== requestId.current) return
        setError(err instanceof Error ? err.message : 'Impossible de charger les produits.')
      })
      .finally(() => {
        if (id !== requestId.current) return
        setLoading(false)
      })
  }, [search])

  async function handleSubmit(input: ProductInput) {
    if (modalProduct === 'new') {
      if (!profile) return
      const created = await createProduct(profile.organization_id, input)
      setProducts((prev) => [...prev, created].sort(byName))
    } else if (modalProduct) {
      const updated = await updateProduct(modalProduct.id, input)
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)).sort(byName))
    }
    setModalProduct(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
        <button
          type="button"
          onClick={() => setModalProduct('new')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Ajouter un produit
        </button>
      </div>

      <input
        type="search"
        placeholder="Rechercher par nom ou référence…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="mt-4 block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-gray-500">Chargement…</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-gray-500">
          {search
            ? 'Aucun produit ne correspond à ta recherche.'
            : "Aucun produit pour l'instant. Ajoute le premier !"}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Référence</th>
                <th className="py-2 pr-4 font-medium">Catégorie</th>
                <th className="py-2 pr-4 font-medium">Quantité</th>
                <th className="py-2 pr-4 font-medium">Seuil</th>
                <th className="py-2 pr-4 font-medium">Prix</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const quantity = Number(p.quantity)
                const alertThreshold = Number(p.alert_threshold)
                const lowStock = quantity <= alertThreshold
                return (
                  <tr key={p.id} className={lowStock ? 'bg-red-50' : undefined}>
                    <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{p.reference ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-600">{p.category ?? '—'}</td>
                    <td
                      className={`py-2 pr-4 ${lowStock ? 'font-semibold text-red-700' : 'text-gray-600'}`}
                    >
                      {quantity}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{alertThreshold}</td>
                    <td className="py-2 pr-4 text-gray-600">{Number(p.price).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setModalProduct(p)}
                        className="text-blue-600 hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="ml-3 text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalProduct !== null && (
        <ProductFormModal
          product={modalProduct === 'new' ? null : modalProduct}
          onCancel={() => setModalProduct(null)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer ce produit ?"
        message={`"${deleteTarget?.name}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
