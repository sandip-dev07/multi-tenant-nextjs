export default function MainPage() {
  return (
    <div className="p-12 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold">Welcome to example.com</h1>
      <p className="text-gray-500 mt-3">
        This is the public landing page — no login required.
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <a
          href="http://app.localhost:3000"
          className="px-5 py-2 bg-black text-white rounded-lg hover:opacity-80"
        >
          Open App
        </a>
        
        <a
          href="http://dash.localhost:3000"
          className="px-5 py-2 border rounded-lg hover:bg-gray-50"
        >
          Open Dashboard
        </a>
      </div>
    </div>
  )
}