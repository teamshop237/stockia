import { useState, type ChangeEvent } from 'react'
import { parseCsv, buildProductInputs, buildTemplateCsv, type CsvImportError } from '../lib/csvImport'
import { parseXlsx } from '../lib/xlsxImport'
import type { Product, ProductInput } from '../types/database'

type ImportProductsModalProps = {
  onCancel: () => void
  onImport: (inputs: ProductInput[]) => Promise<Product[]>
  onImported: (created: Product[]) => void
}

export function ImportProductsModal({ onCancel, onImport, onImported }: ImportProductsModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [valid, setValid] = useState<ProductInput[]>([])
  const [errors, setErrors] = useState<CsvImportError[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImportError(null)
    setValid([])
    setErrors([])

    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      const rows = isExcel ? await parseXlsx(file) : parseCsv(await file.text())
      const result = buildProductInputs(rows)
      setValid(result.valid)
      setErrors(result.errors)
    } catch {
      setErrors([{ line: 0, reason: 'Fichier illisible. Vérifie le format (CSV, XLSX ou XLS).' }])
    }
  }

  function downloadTemplate() {
    const blob = new Blob([String.fromCharCode(0xfeff) + buildTemplateCsv()], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modele-import-stockia.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleConfirm() {
    if (valid.length === 0 || importing) return
    setImporting(true)
    setImportError(null)
    try {
      const created = await onImport(valid)
      onImported(created)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Échec de l'import.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Importer des produits</h2>
        <p className="mt-1 text-sm text-gray-500">
          Fichier CSV, XLSX ou XLS. Colonnes attendues : nom, référence, quantité, seuil d'alerte,
          prix, catégorie (les intitulés anglais courants comme "Product Name" ou "Qty on Hand"
          sont aussi reconnus). Seule la colonne "nom" est obligatoire.
        </p>

        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          Télécharger un modèle CSV
        </button>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
        </div>

        {fileName && (
          <div className="mt-4 max-h-56 overflow-y-auto rounded-md border border-gray-200 p-3 text-sm">
            <p className="font-medium text-gray-900">
              {valid.length} produit{valid.length > 1 ? 's' : ''} prêt{valid.length > 1 ? 's' : ''}{' '}
              à importer
            </p>
            {errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-red-700">
                  {errors.length} ligne{errors.length > 1 ? 's' : ''} ignorée
                  {errors.length > 1 ? 's' : ''} :
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-600">
                  {errors.map((e, i) => (
                    <li key={i}>
                      {e.line > 0 ? `Ligne ${e.line} : ` : ''}
                      {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {importError && <p className="mt-3 text-sm text-red-600">{importError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={importing}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={valid.length === 0 || importing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? 'Import…' : `Importer (${valid.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
