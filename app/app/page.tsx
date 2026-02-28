import { getSession } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function AppPage() {
  const session = getSession()
  const headersList = await headers()
  const subdomain = headersList.get('x-subdomain')

  return (
    <div>
      <h1 className="text-2xl font-bold">App Dashboard</h1>
      <p className="text-gray-400 text-sm mt-1">
        subdomain: <code className="bg-gray-200 px-1 rounded">{subdomain}</code>
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Users', value: '1,240' },
          { label: 'Revenue', value: '$8,320' },
          { label: 'Requests', value: '94.2k' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        Logged in as <strong>{session?.name}</strong> ({session?.email})
      </div>
    </div>
  )
}