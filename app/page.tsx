import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">BookAnything</h1>
        <p className="text-lg text-gray-600 mb-8">
          A simple, flexible booking system for any venue or service
        </p>
        
        <div className="space-y-4">
          <Link
            href="/demo"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Demo
          </Link>
          
          <p className="text-sm text-gray-500">
            Try our booking system with a demo tennis court
          </p>
        </div>
      </div>
    </main>
  )
}