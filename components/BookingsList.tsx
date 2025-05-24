'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Booking } from '@/types/database';
import { fetchBookings, cancelBooking } from '@/lib/database-provider';

interface BookingsListProps {
  venueId: string;
  date: Date;
  onBookingCancelled?: () => void;
}

export default function BookingsList({ venueId, date, onBookingCancelled }: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [venueId, date]);

  const loadBookings = async () => {
    setLoading(true);
    const data = await fetchBookings(venueId, date);
    setBookings(data);
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(bookingId);
      await loadBookings();
      onBookingCancelled?.();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No bookings for this date</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Bookings for {format(date, 'MMMM d, yyyy')}</h3>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className={`p-4 rounded-lg border ${
              booking.status === 'cancelled' 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{booking.customer_name}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                </p>
                <p className="text-sm text-gray-500">{booking.customer_email}</p>
                {booking.status === 'cancelled' && (
                  <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Cancelled
                  </span>
                )}
              </div>
              {booking.status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}