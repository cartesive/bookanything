import { Database } from 'duckdb-async';
import path from 'path';
import fs from 'fs';
import { Venue, Booking, TimeSlot } from '@/types/database';

let db: Database | null = null;

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bookings.db');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function getServerDatabase(): Promise<Database> {
  if (!db) {
    ensureDataDirectory();
    
    // Create or connect to persistent database file
    db = await Database.create(DB_PATH);
    await initializeSchema();
    await seedDemoData();
  }
  return db;
}

async function initializeSchema() {
  if (!db) throw new Error('Database not initialized');
  
  // Create tables with proper constraints and indexes
  await db.run(`
    CREATE TABLE IF NOT EXISTS venues (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      timezone VARCHAR NOT NULL DEFAULT 'UTC',
      settings JSON,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id VARCHAR PRIMARY KEY,
      venue_id VARCHAR NOT NULL,
      day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT true,
      max_capacity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id),
      UNIQUE(venue_id, day_of_week, start_time)
    );
  `);

  await db.run(`
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
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    );
  `);

  // Create indexes for better performance
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_bookings_venue_date 
    ON bookings(venue_id, start_time);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON bookings(status);
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_time_slots_venue_day 
    ON time_slots(venue_id, day_of_week);
  `);
}

async function seedDemoData() {
  if (!db) throw new Error('Database not initialized');
  
  try {
    // Check if demo venue already exists
    const existingVenue = await db.all(`SELECT id FROM venues WHERE id = 'demo-tennis-court'`);
    if (existingVenue.length > 0) {
      return; // Already seeded
    }
    
    console.log('Seeding demo data to persistent database...');
    
    // Insert demo venue
    await db.run(`
      INSERT INTO venues (id, name, description, timezone, settings, is_active)
      VALUES (
        'demo-tennis-court',
        'Community Tennis Court',
        'Local tennis court available for booking',
        'America/New_York',
        '{"booking_duration_minutes": 60, "advance_booking_days": 14, "cancellation_minutes": 120, "max_bookings_per_user": 2}',
        true
      )
    `);
    
    // Insert time slots (9 AM to 6 PM, Monday to Friday)
    for (let day = 1; day <= 5; day++) {
      for (let hour = 9; hour < 18; hour++) {
        await db.run(`
          INSERT INTO time_slots (id, venue_id, day_of_week, start_time, end_time, is_available, max_capacity)
          VALUES (
            'slot-${day}-${hour}',
            'demo-tennis-court',
            ${day},
            '${hour.toString().padStart(2, '0')}:00:00',
            '${(hour + 1).toString().padStart(2, '0')}:00:00',
            true,
            1
          )
        `);
      }
    }
    
    // Add weekend slots (Saturday and Sunday, 8 AM to 8 PM)
    for (let day of [0, 6]) { // Sunday = 0, Saturday = 6
      for (let hour = 8; hour < 20; hour++) {
        await db.run(`
          INSERT INTO time_slots (id, venue_id, day_of_week, start_time, end_time, is_available, max_capacity)
          VALUES (
            'slot-${day}-${hour}',
            'demo-tennis-court',
            ${day},
            '${hour.toString().padStart(2, '0')}:00:00',
            '${(hour + 1).toString().padStart(2, '0')}:00:00',
            true,
            1
          )
        `);
      }
    }
    
    console.log('Demo data seeded successfully!');
  } catch (error) {
    console.warn('Demo data seeding failed:', error);
  }
}

// Server-side database functions
export async function fetchVenueServer(venueId: string): Promise<Venue | null> {
  const db = await getServerDatabase();
  const result = await db.all(`SELECT * FROM venues WHERE id = ? AND is_active = true`, [venueId]);
  
  if (result.length === 0) return null;
  
  const row = result[0] as any;
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

export async function fetchTimeSlotsServer(venueId: string): Promise<TimeSlot[]> {
  const db = await getServerDatabase();
  const result = await db.all(`
    SELECT * FROM time_slots 
    WHERE venue_id = ? AND is_available = true
    ORDER BY day_of_week, start_time
  `, [venueId]);
  
  return result.map((row: any) => ({
    id: row.id,
    venue_id: row.venue_id,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    is_available: row.is_available,
    created_at: new Date(row.created_at)
  }));
}

export async function fetchBookingsServer(venueId: string, date: Date): Promise<Booking[]> {
  const db = await getServerDatabase();
  
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const result = await db.all(`
    SELECT * FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ? 
      AND start_time < ?
    ORDER BY start_time
  `, [venueId, startOfDay.toISOString(), endOfDay.toISOString()]);
  
  return result.map((row: any) => ({
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

export async function createBookingServer(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
  const db = await getServerDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.run(`
    INSERT INTO bookings (
      id, venue_id, customer_name, customer_email, customer_phone,
      start_time, end_time, status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
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
  ]);
  
  return {
    ...booking,
    id,
    created_at: now,
    updated_at: now
  };
}

export async function fetchAllBookingsServer(venueId: string, startDate?: Date, endDate?: Date): Promise<Booking[]> {
  const db = await getServerDatabase();
  
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
  
  const result = await db.all(query, params);
  
  return result.map((row: any) => ({
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

export async function updateBookingStatusServer(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled', adminNotes?: string): Promise<void> {
  const db = await getServerDatabase();
  
  await db.run(`
    UPDATE bookings 
    SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, adminNotes || null, bookingId]);
}

export async function getBookingStatsServer(venueId: string): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  todayBookings: number;
  weekBookings: number;
  monthlyRevenue: number;
}> {
  const db = await getServerDatabase();
  
  // Get overall stats
  const statsResult = await db.all(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM bookings 
    WHERE venue_id = ?
  `, [venueId]);
  
  const stats = statsResult[0] as any || { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  
  // Get today's bookings
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const todayResult = await db.all(`
    SELECT COUNT(*) as count
    FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ? 
      AND start_time < ?
  `, [venueId, startOfDay.toISOString(), endOfDay.toISOString()]);
  
  const todayCount = todayResult[0] as any;
  
  // Get this week's bookings
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekResult = await db.all(`
    SELECT COUNT(*) as count
    FROM bookings 
    WHERE venue_id = ? 
      AND start_time >= ?
  `, [venueId, weekAgo.toISOString()]);
  
  const weekCount = weekResult[0] as any;
  
  return {
    total: Number(stats.total) || 0,
    pending: Number(stats.pending) || 0,
    confirmed: Number(stats.confirmed) || 0,
    cancelled: Number(stats.cancelled) || 0,
    todayBookings: Number(todayCount?.count) || 0,
    weekBookings: Number(weekCount?.count) || 0,
    monthlyRevenue: 0 // TODO: Calculate based on pricing
  };
}

// Admin functions for venue management
export async function createVenueServer(venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue> {
  const db = await getServerDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.run(`
    INSERT INTO venues (id, name, description, timezone, settings, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, true, ?, ?)
  `, [
    id,
    venue.name,
    venue.description || null,
    venue.timezone,
    JSON.stringify(venue.settings),
    now.toISOString(),
    now.toISOString()
  ]);
  
  return {
    ...venue,
    id,
    created_at: now,
    updated_at: now
  };
}

export async function updateVenueServer(venueId: string, updates: Partial<Venue>): Promise<void> {
  const db = await getServerDatabase();
  
  const setClause = [];
  const params = [];
  
  if (updates.name) {
    setClause.push('name = ?');
    params.push(updates.name);
  }
  
  if (updates.description !== undefined) {
    setClause.push('description = ?');
    params.push(updates.description);
  }
  
  if (updates.timezone) {
    setClause.push('timezone = ?');
    params.push(updates.timezone);
  }
  
  if (updates.settings) {
    setClause.push('settings = ?');
    params.push(JSON.stringify(updates.settings));
  }
  
  setClause.push('updated_at = CURRENT_TIMESTAMP');
  params.push(venueId);
  
  await db.run(`
    UPDATE venues 
    SET ${setClause.join(', ')}
    WHERE id = ?
  `, params);
}

export async function createTimeSlotServer(timeSlot: Omit<TimeSlot, 'id' | 'created_at'>): Promise<TimeSlot> {
  const db = await getServerDatabase();
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  await db.run(`
    INSERT INTO time_slots (id, venue_id, day_of_week, start_time, end_time, is_available, max_capacity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    timeSlot.venue_id,
    timeSlot.day_of_week,
    timeSlot.start_time,
    timeSlot.end_time,
    timeSlot.is_available,
    1, // Default capacity
    now.toISOString()
  ]);
  
  return {
    ...timeSlot,
    id,
    created_at: now
  };
}

export async function updateTimeSlotServer(timeSlotId: string, updates: Partial<TimeSlot>): Promise<void> {
  const db = await getServerDatabase();
  
  const setClause = [];
  const params = [];
  
  if (updates.start_time) {
    setClause.push('start_time = ?');
    params.push(updates.start_time);
  }
  
  if (updates.end_time) {
    setClause.push('end_time = ?');
    params.push(updates.end_time);
  }
  
  if (updates.is_available !== undefined) {
    setClause.push('is_available = ?');
    params.push(updates.is_available);
  }
  
  params.push(timeSlotId);
  
  await db.run(`
    UPDATE time_slots 
    SET ${setClause.join(', ')}
    WHERE id = ?
  `, params);
}

export async function deleteTimeSlotServer(timeSlotId: string): Promise<void> {
  const db = await getServerDatabase();
  await db.run(`DELETE FROM time_slots WHERE id = ?`, [timeSlotId]);
}

export async function getAllVenuesServer(): Promise<Venue[]> {
  const db = await getServerDatabase();
  const result = await db.all(`SELECT * FROM venues WHERE is_active = true ORDER BY name`);
  
  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    timezone: row.timezone,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}