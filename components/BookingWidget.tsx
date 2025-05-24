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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h2 className="text-3xl font-bold text-white">{venue.name}</h2>
          {venue.description && (
            <p className="text-blue-100 mt-2">{venue.description}</p>
          )}
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Select a Date
                </h3>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>
            </div>

            <div>
              {selectedDate ? (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {format(selectedDate, 'MMM d')}
                  </h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <TimeSlots
                      slots={availableSlots}
                      selectedSlot={selectedSlot}
                      onSlotSelect={handleSlotSelect}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <svg className="w-12 h-12 text-blue-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">Select a date to view available time slots</p>
                </div>
              )}
            </div>
          </div>

          {showForm && selectedSlot && selectedDate && (
            <div className="mt-8">
              <BookingForm
                venueId={venueId}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                onSubmit={handleBookingSubmit}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}