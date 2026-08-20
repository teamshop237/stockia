import { hasRecognizableHeader } from './csvImport'

export async function parseXlsx(file: File): Promise<string[][]> {
  const { read, utils } = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: 'array' })

  const sheets = workbook.SheetNames.map((name) =>
    utils
      .sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: '', raw: false })
      .map((row) => row.map((cell) => (cell == null ? '' : String(cell)))),
  )

  // Un classeur a souvent plusieurs feuilles (Instructions, Dashboard, etc.) :
  // on prend la première qui ressemble vraiment à une liste de produits.
  return sheets.find(hasRecognizableHeader) ?? sheets[0] ?? []
}
