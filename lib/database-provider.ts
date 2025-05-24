'use client';

import { Venue, Booking, TimeSlot, BookingSlot } from '@/types/database';
import * as localStorage from '@/lib/database-client';
import * as duckdbWasm from '@/lib/duckdb-wasm';

// Flag to switch between localStorage and DuckDB
const USE_DUCKDB = typeof window !== 'undefined' && window.location.search.includes('duckdb=true');

export async function fetchVenue(venueId: string): Promise<Venue | null> {
  if (USE_DUCKDB) {
    return duckdbWasm.fetchVenue(venueId);
  }
  return localStorage.fetchVenue(venueId);
}

export async function fetchTimeSlots(venueId: string): Promise<TimeSlot[]> {
  if (USE_DUCKDB) {
    return duckdbWasm.fetchTimeSlots(venueId);
  }
  return localStorage.fetchTimeSlots(venueId);
}

export async function fetchBookings(venueId: string, date: Date): Promise<Booking[]> {
  if (USE_DUCKDB) {
    return duckdbWasm.fetchBookings(venueId, date);
  }
  return localStorage.fetchBookings(venueId, date);
}

export async function fetchAvailableSlots(
  venueId: string,
  date: Date
): Promise<BookingSlot[]> {
  // This function needs to be implemented for DuckDB
  if (USE_DUCKDB) {
    const venue = await fetchVenue(venueId);
    if (!venue) return [];
    
    const timeSlots = await fetchTimeSlots(venueId);
    const bookings = await fetchBookings(venueId, date);
    
    const dayOfWeek = date.getDay();
    const relevantSlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
    
    const availableSlots: BookingSlot[] = [];
    
    for (const slot of relevantSlots) {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      
      const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
      const slotEnd = new Date(date);
      slotEnd.setHours(endHours, endMinutes, 0, 0);
      
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
    }
    
    return availableSlots;
  }
  
  return localStorage.fetchAvailableSlots(venueId, date);
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<Booking> {
  if (USE_DUCKDB) {
    return duckdbWasm.createBooking(booking);
  }
  return localStorage.createBooking(booking);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  if (USE_DUCKDB) {
    return duckdbWasm.cancelBooking(bookingId);
  }
  return localStorage.cancelBooking(bookingId);
}