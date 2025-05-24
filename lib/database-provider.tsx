'use client';

import { Venue, Booking, TimeSlot, BookingSlot } from '@/types/database';

// Client-side functions that call the API routes
export async function fetchVenue(venueId: string): Promise<Venue | null> {
  const response = await fetch(`/api/venues/${venueId}`);
  if (!response.ok) return null;
  return response.json();
}

export async function fetchTimeSlots(venueId: string): Promise<TimeSlot[]> {
  const response = await fetch(`/api/venues/${venueId}/timeslots`);
  if (!response.ok) return [];
  return response.json();
}

export async function fetchBookings(venueId: string, date: Date): Promise<Booking[]> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const response = await fetch(
    `/api/venues/${venueId}/bookings?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
  );
  if (!response.ok) return [];
  
  const data = await response.json();
  return data.map((booking: any) => ({
    ...booking,
    start_time: new Date(booking.start_time),
    end_time: new Date(booking.end_time),
    created_at: new Date(booking.created_at),
    updated_at: new Date(booking.updated_at),
  }));
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<Booking> {
  const response = await fetch(`/api/venues/${booking.venue_id}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...booking,
      start_time: booking.start_time.toISOString(),
      end_time: booking.end_time.toISOString(),
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create booking');
  }
  
  const data = await response.json();
  return {
    ...data,
    start_time: new Date(data.start_time),
    end_time: new Date(data.end_time),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

export async function cancelBooking(bookingId: string): Promise<void> {
  // This would need to be implemented with proper venue context
  throw new Error('Cancel booking not implemented in client API');
}

export async function fetchAvailableSlots(venueId: string, date: Date): Promise<BookingSlot[]> {
  const venue = await fetchVenue(venueId);
  if (!venue) return [];
  
  const timeSlots = await fetchTimeSlots(venueId);
  const bookings = await fetchBookings(venueId, date);
  
  const dayOfWeek = date.getDay();
  const relevantSlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
  
  const availableSlots: BookingSlot[] = [];
  
  for (const slot of relevantSlots) {
    try {
      // Handle different time formats from API
      const startTimeStr = typeof slot.start_time === 'string' ? slot.start_time : String(slot.start_time);
      const endTimeStr = typeof slot.end_time === 'string' ? slot.end_time : String(slot.end_time);
      
      // Parse time strings and validate
      const startTimeParts = startTimeStr.split(':');
      const endTimeParts = endTimeStr.split(':');
      
      if (startTimeParts.length < 2 || endTimeParts.length < 2) {
        console.warn('Invalid time format:', startTimeStr, endTimeStr);
        continue;
      }
      
      const hours = parseInt(startTimeParts[0], 10);
      const minutes = parseInt(startTimeParts[1], 10);
      const endHours = parseInt(endTimeParts[0], 10);
      const endMinutes = parseInt(endTimeParts[1], 10);
      
      // Validate parsed time values
      if (isNaN(hours) || isNaN(minutes) || isNaN(endHours) || isNaN(endMinutes)) {
        console.warn('Invalid time values:', hours, minutes, endHours, endMinutes);
        continue;
      }
      
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(endHours, endMinutes, 0, 0);
      
      // Validate that dates were created successfully
      if (isNaN(slotStart.getTime()) || isNaN(slotEnd.getTime())) {
        console.warn('Invalid dates created for slot:', slot);
        continue;
      }
      
      // Check if slot is in the past
      if (slotStart < new Date()) continue;
      
      // Check if slot conflicts with existing bookings
      const hasConflict = bookings.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        return (
          booking.status !== 'cancelled' &&
          ((slotStart >= bookingStart && slotStart < bookingEnd) ||
           (slotEnd > bookingStart && slotEnd <= bookingEnd))
        );
      });
      
      availableSlots.push({
        start: slotStart,
        end: slotEnd,
        available: !hasConflict,
      });
    } catch (error) {
      console.warn('Error processing time slot:', slot, error);
    }
  }
  
  return availableSlots;
}