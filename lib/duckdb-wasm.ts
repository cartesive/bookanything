'use client';

import * as duckdb from '@duckdb/duckdb-wasm';
import { Venue, Booking, TimeSlot } from '@/types/database';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// Initialize DuckDB WASM
export async function initializeDuckDB() {
  if (db) return db;

  try {
    // Create manual bundles to avoid worker CORS issues
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    
    // Select the MVP bundle for better compatibility
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    // For development, create a simple worker setup
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: 'text/javascript',
      })
    );
    
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule);
    
    // Get a connection
    conn = await db.connect();
    
    // Initialize schema
    await initializeSchema();
    await seedDemoData();
    
    return db;
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

async function initializeSchema() {
  if (!conn) throw new Error('Database connection not initialized');
  
  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS venues (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      timezone VARCHAR NOT NULL DEFAULT 'UTC',
      settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id VARCHAR PRIMARY KEY,
      venue_id VARCHAR NOT NULL,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    );
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR PRIMARY KEY,
      venue_id VARCHAR NOT NULL,
      customer_name VARCHAR NOT NULL,
      customer_email VARCHAR NOT NULL,
      customer_phone VARCHAR,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    );
  `);
}

let isSeeded = false;

async function seedDemoData() {
  if (!conn) throw new Error('Database connection not initialized');
  if (isSeeded) return; // Prevent multiple seeding attempts
  
  try {
    // Check if demo venue already exists
    const existingVenue = await conn.query(`SELECT id FROM venues WHERE id = 'demo-tennis-court'`);
    if (existingVenue.numRows > 0) {
      isSeeded = true;
      return; // Already seeded
    }
    
    // Insert demo venue
    await conn.query(`
      INSERT INTO venues (id, name, description, timezone, settings)
      VALUES (
        'demo-tennis-court',
        'Community Tennis Court',
        'Local tennis court available for booking',
        'America/New_York',
        '{"booking_duration_minutes": 60, "advance_booking_days": 14, "cancellation_minutes": 120, "max_bookings_per_user": 2}'
      )
    `);
    
    // Insert time slots (9 AM to 6 PM, Monday to Friday)
    for (let day = 1; day <= 5; day++) {
      for (let hour = 9; hour < 18; hour++) {
        await conn.query(`
          INSERT INTO time_slots (id, venue_id, day_of_week, start_time, end_time)
          VALUES (
            'slot-${day}-${hour}',
            'demo-tennis-court',
            ${day},
            '${hour.toString().padStart(2, '0')}:00:00',
            '${(hour + 1).toString().padStart(2, '0')}:00:00'
          )
        `);
      }
    }
    
    isSeeded = true;
    console.log('Demo data seeded successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Duplicate key')) {
      console.log('Demo data already exists, skipping seeding');
      isSeeded = true;
    } else {
      console.warn('Demo data seeding failed:', error);
    }
  }
}

export async function fetchVenue(venueId: string): Promise<Venue | null> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`SELECT * FROM venues WHERE id = ?`);
  const result = await stmt.query(venueId);
  
  if (result.numRows === 0) return null;
  
  const row = result.toArray()[0] as any;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    timezone: row.timezone,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  };
}

export async function fetchTimeSlots(venueId: string): Promise<TimeSlot[]> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`
    SELECT * FROM time_slots 
    WHERE venue_id = ? AND is_available = true
    ORDER BY day_of_week, start_time
  `);
  const result = await stmt.query(venueId);
  
  return result.toArray().map((row: any) => ({
    id: row.id,
    venue_id: row.venue_id,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    is_available: row.is_available,
    created_at: new Date(row.created_at)
  }));
}

export async function fetchBookings(venueId: string, date: Date): Promise<Booking[]> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const stmt = await conn.prepare(`
    SELECT * FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ? 
      AND start_time < ?
    ORDER BY start_time
  `);
  const result = await stmt.query(venueId, startOfDay.toISOString(), endOfDay.toISOString());
  
  return result.toArray().map((row: any) => ({
    id: row.id,
    venue_id: row.venue_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    start_time: new Date(row.start_time),
    end_time: new Date(row.end_time),
    status: row.status,
    notes: row.notes,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  const stmt = await conn.prepare(`
    INSERT INTO bookings (
      id, venue_id, customer_name, customer_email, customer_phone,
      start_time, end_time, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  await stmt.query(
    id,
    booking.venue_id,
    booking.customer_name,
    booking.customer_email,
    booking.customer_phone || null,
    booking.start_time.toISOString(),
    booking.end_time.toISOString(),
    booking.status,
    booking.notes || null,
    now.toISOString(),
    now.toISOString()
  );
  
  return {
    ...booking,
    id,
    created_at: now,
    updated_at: now
  };
}

export async function cancelBooking(bookingId: string): Promise<void> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`
    UPDATE bookings 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  await stmt.query(bookingId);
}

export async function fetchAllBookings(venueId: string, startDate?: Date, endDate?: Date): Promise<Booking[]> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  let query = `SELECT * FROM bookings WHERE venue_id = ?`;
  const params: any[] = [venueId];
  
  if (startDate) {
    query += ` AND start_time >= ?`;
    params.push(startDate.toISOString());
  }
  
  if (endDate) {
    query += ` AND start_time <= ?`;
    params.push(endDate.toISOString());
  }
  
  query += ` ORDER BY start_time DESC`;
  
  const stmt = await conn.prepare(query);
  const result = await stmt.query(...params);
  
  return result.toArray().map((row: any) => ({
    id: row.id,
    venue_id: row.venue_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    start_time: new Date(row.start_time),
    end_time: new Date(row.end_time),
    status: row.status,
    notes: row.notes,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}

export async function updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`
    UPDATE bookings 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  await stmt.query(status, bookingId);
}

export async function getBookingStats(venueId: string): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  todayBookings: number;
  weekBookings: number;
}> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  // Get overall stats
  const statsStmt = await conn.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM bookings 
    WHERE venue_id = ?
  `);
  const statsResult = await statsStmt.query(venueId);
  const stats = statsResult.toArray()[0] as any || { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  
  // Get today's bookings
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const todayStmt = await conn.prepare(`
    SELECT COUNT(*) as count
    FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ? 
      AND start_time < ?
  `);
  const todayResult = await todayStmt.query(venueId, startOfDay.toISOString(), endOfDay.toISOString());
  const todayCount = todayResult.toArray()[0] as any;
  
  // Get this week's bookings
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekStmt = await conn.prepare(`
    SELECT COUNT(*) as count
    FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ?
  `);
  const weekResult = await weekStmt.query(venueId, weekAgo.toISOString());
  const weekCount = weekResult.toArray()[0] as any;
  
  return {
    total: Number(stats.total) || 0,
    pending: Number(stats.pending) || 0,
    confirmed: Number(stats.confirmed) || 0,
    cancelled: Number(stats.cancelled) || 0,
    todayBookings: Number(todayCount?.count) || 0,
    weekBookings: Number(weekCount?.count) || 0,
  };
}

// Utility function to get available slots
export async function fetchAvailableSlots(venueId: string, date: Date): Promise<Array<{ start: Date; end: Date; available: boolean }>> {
  const venue = await fetchVenue(venueId);
  if (!venue) return [];
  
  const timeSlots = await fetchTimeSlots(venueId);
  const bookings = await fetchBookings(venueId, date);
  
  const dayOfWeek = date.getDay();
  const relevantSlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
  
  const availableSlots: Array<{ start: Date; end: Date; available: boolean }> = [];
  
  for (const slot of relevantSlots) {
    try {
      // Handle different time formats from DuckDB
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