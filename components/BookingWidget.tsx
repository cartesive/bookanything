'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Calendar from './Calendar';
import TimeSlots from './TimeSlots';
import BookingForm from './BookingForm';
import { fetchVenue, fetchAvailableSlots, createBooking } from '@/lib/database-client';
import { Venue, BookingSlot } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

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
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
          <p className="text-muted-foreground mb-6">
            Your booking for {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at{' '}
            {selectedSlot && format(selectedSlot.start, 'h:mm a')} has been confirmed.
          </p>
          <Button onClick={resetBooking}>
            Make Another Booking
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/90 px-8 py-6 text-primary-foreground">
          <h2 className="text-3xl font-bold">{venue.name}</h2>
          {venue.description && (
            <p className="mt-2 opacity-90">{venue.description}</p>
          )}
        </div>

        <div className="p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Select a Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                  />
                </CardContent>
              </Card>
            </div>

            <div>
              {selectedDate ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {format(selectedDate, 'MMM d')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <TimeSlots
                        slots={availableSlots}
                        selectedSlot={selectedSlot}
                        onSlotSelect={handleSlotSelect}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 text-center">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a date to view available time slots</p>
                  </CardContent>
                </Card>
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
      </Card>
    </div>
  );
}