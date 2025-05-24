import BookingWidget from '@/components/BookingWidget';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Book a Tennis Court</h1>
          <p className="text-gray-600">
            Demo of the BookAnything system - try booking a time slot!
          </p>
        </div>
        
        <BookingWidget venueId="demo-tennis-court" />
      </div>
    </main>
  );
}