import { getSession } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  // x-pathname is the ORIGINAL pathname set by middleware
  const pathname = headersList.get('x-pathname') ?? ''
  const isLoginPage = pathname === '/login' || pathname.startsWith('/login/')

  // ✅ No redirect here — middleware already handles it
  // Layout just uses session for display purposes
  const session = getSession()

  return (
    <div className="flex h-screen">
      {!isLoginPage && (
        <aside className="w-60 bg-gray-900 text-white p-4 flex flex-col shrink-0">
          <div className="font-bold text-base mb-6">app.localhost</div>
          <nav className="space-y-1 text-sm flex-1">
            <a href="/" className="block px-3 py-2 rounded hover:bg-gray-700">Home</a>
            <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Settings</a>
          </nav>
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-700 leading-relaxed">
            {session?.name}<br />
            <span className="opacity-60">{session?.email}</span>
          </div>
        </aside>
      )}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}