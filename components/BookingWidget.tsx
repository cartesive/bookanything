'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Calendar from './Calendar';
import TimeSlots from './TimeSlots';
import BookingForm from './BookingForm';
import { fetchVenue, fetchAvailableSlots, createBooking } from '@/lib/database-client';
import { Venue, BookingSlot } from '@/types/database';

interface BookingWidgetProps {
  venueId: string;
}

export default function BookingWidget({ venueId }: BookingWidgetProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchVenue(venueId).then(setVenue);
  }, [venueId]);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      fetchAvailableSlots(venueId, selectedDate)
        .then(setAvailableSlots)
        .finally(() => setLoading(false));
    }
  }, [venueId, selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowForm(false);
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setShowForm(true);
  };

  const handleBookingSubmit = async (bookingData: Parameters<typeof createBooking>[0]) => {
    const booking = await createBooking(bookingData);
    setBookingSuccess(true);
    setShowForm(false);
    
    // Refresh available slots
    if (selectedDate) {
      const slots = await fetchAvailableSlots(venueId, selectedDate);
      setAvailableSlots(slots);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedSlot(null);
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setShowForm(false);
    setBookingSuccess(false);
    setAvailableSlots([]);
  };

  if (!venue) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600 mb-6">
          Your booking for {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at{' '}
          {selectedSlot && format(selectedSlot.start, 'h:mm a')} has been confirmed.
        </p>
        <button
          onClick={resetBooking}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">{venue.name}</h2>
        {venue.description && (
          <p className="text-gray-600 mb-4">{venue.description}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Select a Date</h3>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        <div>
          {selectedDate && (
            <>
              <h3 className="text-lg font-semibold mb-4">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <TimeSlots
                  slots={availableSlots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showForm && selectedSlot && selectedDate && (
        <BookingForm
          venueId={venueId}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSubmit={handleBookingSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}