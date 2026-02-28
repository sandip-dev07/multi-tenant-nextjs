export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Pre-resolve DNS + TLS for subdomains in the background */}
      <link rel="preconnect" href="http://app.localhost:3000" />
      <link rel="preconnect" href="http://dash.localhost:3000" />

      {/* Pre-fetch the actual page HTML */}
      <link rel="prefetch" href="http://app.localhost:3000" />

      <header className="p-4 border-b flex justify-between items-center">
        <span className="font-bold">example.com</span>
        <a href="http://app.localhost:3000">Go to App →</a>
      </header>
      <main>{children}</main>
    </div>
  )
}