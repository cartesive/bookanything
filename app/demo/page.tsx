import BookingWidget from '@/components/BookingWidget';

export default function DemoPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book a Tennis Court</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our booking system with this demo tennis court. Select a date and time to make a reservation.
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Demo data is stored locally in your browser
          </div>
        </div>
        
        <BookingWidget venueId="demo-tennis-court" />
      </div>
    </div>
  );
}