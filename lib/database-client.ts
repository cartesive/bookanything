import { Venue, Booking, TimeSlot, BookingSlot } from '@/types/database';

// For static export, we'll use localStorage to persist bookings
// In production, this would connect to your DuckDB backend

const STORAGE_KEY = 'bookanything_data';

interface StorageData {
  venues: Record<string, Venue>;
  timeSlots: Record<string, TimeSlot[]>;
  bookings: Record<string, Booking[]>;
}

function getStorageData(): StorageData {
  if (typeof window === 'undefined') {
    return { venues: {}, timeSlots: {}, bookings: {} };
  }
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialData = getInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  
  return JSON.parse(data);
}

function saveStorageData(data: StorageData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function getInitialData(): StorageData {
  const demoVenue: Venue = {
    id: 'demo-tennis-court',
    name: 'Community Tennis Court',
    description: 'Local tennis court available for booking',
    timezone: 'America/New_York',
    settings: {
      booking_duration_minutes: 60,
      advance_booking_days: 14,
      cancellation_minutes: 120,
      max_bookings_per_user: 2,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  const timeSlots: TimeSlot[] = [];
  // Generate time slots for weekdays 9 AM to 6 PM
  for (let day = 1; day <= 5; day++) {
    for (let hour = 9; hour < 18; hour++) {
      timeSlots.push({
        id: `slot-${day}-${hour}`,
        venue_id: 'demo-tennis-court',
        day_of_week: day,
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        is_available: true,
        recurring: true,
      });
    }
  }
  
  return {
    venues: { 'demo-tennis-court': demoVenue },
    timeSlots: { 'demo-tennis-court': timeSlots },
    bookings: { 'demo-tennis-court': [] },
  };
}

export async function fetchVenue(venueId: string): Promise<Venue | null> {
  const data = getStorageData();
  return data.venues[venueId] || null;
}

export async function fetchTimeSlots(venueId: string): Promise<TimeSlot[]> {
  const data = getStorageData();
  return data.timeSlots[venueId] || [];
}

export async function fetchBookings(venueId: string, date: Date): Promise<Booking[]> {
  const data = getStorageData();
  const bookings = data.bookings[venueId] || [];
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return bookings.filter(booking => {
    const bookingStart = new Date(booking.start_time);
    return bookingStart >= startOfDay && bookingStart <= endOfDay;
  });
}

export async function fetchAvailableSlots(
  venueId: string,
  date: Date
): Promise<BookingSlot[]> {
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

export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<Booking> {
  const data = getStorageData();
  
  const newBooking: Booking = {
    ...booking,
    id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  if (!data.bookings[booking.venue_id]) {
    data.bookings[booking.venue_id] = [];
  }
  
  data.bookings[booking.venue_id].push(newBooking);
  saveStorageData(data);
  
  return newBooking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const data = getStorageData();
  
  for (const venueId in data.bookings) {
    const bookingIndex = data.bookings[venueId].findIndex(b => b.id === bookingId);
    if (bookingIndex >= 0) {
      data.bookings[venueId][bookingIndex].status = 'cancelled';
      data.bookings[venueId][bookingIndex].updated_at = new Date();
      saveStorageData(data);
      return;
    }
  }
  
  throw new Error('Booking not found');
}