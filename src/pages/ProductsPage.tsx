import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} from '../lib/products'
import type { Product, ProductInput } from '../types/database'
import { ProductFormModal } from '../components/ProductFormModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ImportProductsModal } from '../components/ImportProductsModal'
import { StockMovementsModal } from '../components/StockMovementsModal'

function byName(a: Product, b: Product) {
  return a.name.localeCompare(b.name)
}

export function ProductsPage() {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState<Product | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [importOpen, setImportOpen] = useState(false)
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null)

  const requestId = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    setLoadError(null)
    listProducts(search)
      .then((data) => {
        if (id !== requestId.current) return
        setProducts(data)
      })
      .catch((err) => {
        if (id !== requestId.current) return
        setLoadError(err instanceof Error ? err.message : 'Impossible de charger les produits.')
      })
      .finally(() => {
        if (id !== requestId.current) return
        setLoading(false)
      })
  }, [search, reloadToken])

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
    setDeleteError(null)
    try {
      await deleteProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Échec de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Importer CSV
          </button>
          <button
            type="button"
            onClick={() => setModalProduct('new')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Ajouter un produit
          </button>
        </div>
      </div>

      <input
        type="search"
        placeholder="Rechercher par nom ou référence…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="mt-4 block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
      />

      {loadError && (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadToken((t) => t + 1)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}

      {loading ? (
        <p className="mt-6 text-gray-500">Chargement…</p>
      ) : loadError ? null : products.length === 0 ? (
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
                        onClick={() => setHistoryTarget(p)}
                        className="text-gray-600 hover:underline"
                      >
                        Historique
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalProduct(p)}
                        className="ml-3 text-blue-600 hover:underline"
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

      {importOpen && profile && (
        <ImportProductsModal
          onCancel={() => setImportOpen(false)}
          onImport={(inputs) => importProducts(profile.organization_id, inputs)}
          onImported={(created) => {
            setProducts((prev) => [...prev, ...created].sort(byName))
            setImportOpen(false)
          }}
        />
      )}

      {historyTarget && (
        <StockMovementsModal
          product={historyTarget}
          onCancel={() => setHistoryTarget(null)}
          onQuantityChange={(productId, newQuantity) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === productId ? { ...p, quantity: newQuantity } : p)),
            )
            setHistoryTarget((prev) => (prev ? { ...prev, quantity: newQuantity } : prev))
          }}
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
