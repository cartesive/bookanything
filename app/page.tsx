import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple Booking System for Everyone
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Drop-in booking solution for tennis courts, meeting rooms, equipment rentals, 
            and any resource that needs scheduling
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              Try Demo
            </Link>
            <Link
              href="/embed"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-md border border-gray-200"
            >
              Get Embed Code
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Calendar Interface</h3>
            <p className="text-gray-600 text-sm">
              Intuitive date picker with clear availability indicators. Users can quickly find and book open slots.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Server Required</h3>
            <p className="text-gray-600 text-sm">
              Works with static hosting. Uses browser storage for demo, easily connects to any backend.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Simple Embed</h3>
            <p className="text-gray-600 text-sm">
              Add booking functionality to any website with a single script tag. Fully customizable styling.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              '🎾 Tennis Courts',
              '🏢 Meeting Rooms',
              '🏋️ Gym Equipment',
              '📚 Study Spaces',
              '🚗 Parking Spots',
              '📸 Photo Studios',
              '🎪 Event Spaces',
              '🛠️ Tool Libraries'
            ].map((item) => (
              <div key={item} className="text-center py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}