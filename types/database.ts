export interface Venue {
  id: string;
  name: string;
  description: string;
  timezone: string;
  settings: VenueSettings;
  created_at: Date;
  updated_at: Date;
}

export interface VenueSettings {
  booking_duration_minutes: number;
  advance_booking_days: number;
  cancellation_minutes: number;
  max_bookings_per_user?: number;
  requires_approval?: boolean;
  custom_fields?: CustomField[];
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

export interface TimeSlot {
  id: string;
  venue_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  is_available: boolean;
  created_at: Date;
}

export interface Booking {
  id: string;
  venue_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  start_time: Date;
  end_time: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BookingSlot {
  start: Date;
  end: Date;
  available: boolean;
}