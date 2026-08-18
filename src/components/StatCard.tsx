type StatCardProps = {
  label: string
  value: string
  accent?: boolean
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${accent ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
