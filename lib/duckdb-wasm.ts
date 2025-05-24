'use client';

import * as duckdb from '@duckdb/duckdb-wasm';
import { Venue, Booking, TimeSlot } from '@/types/database';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// Initialize DuckDB WASM
export async function initializeDuckDB() {
  if (db) return db;

  try {
    // Use jsDelivr CDN bundles
    const bundles = duckdb.getJsDelivrBundles();
    
    // Select bundle based on browser support
    const bundle = await duckdb.selectBundle(bundles);
    
    // Instantiate the asynchronous version of DuckDB-WASM
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
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
  await conn.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      timezone VARCHAR NOT NULL DEFAULT 'UTC',
      settings JSON NOT NULL DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await conn.exec(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id VARCHAR PRIMARY KEY,
      venue_id VARCHAR NOT NULL,
      day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT true,
      recurring BOOLEAN NOT NULL DEFAULT true,
      specific_date DATE,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  `);

  await conn.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR PRIMARY KEY,
      venue_id VARCHAR NOT NULL,
      user_name VARCHAR NOT NULL,
      user_email VARCHAR NOT NULL,
      user_phone VARCHAR,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      custom_data JSON,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  await conn.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_venue_time ON bookings(venue_id, start_time, end_time);`);
  await conn.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`);
  await conn.exec(`CREATE INDEX IF NOT EXISTS idx_time_slots_venue ON time_slots(venue_id);`);
}

async function seedDemoData() {
  if (!conn) throw new Error('Database connection not initialized');
  
  // Check if demo venue already exists
  const result = await conn.exec(`SELECT COUNT(*) as count FROM venues WHERE id = 'demo-tennis-court'`);
  const rows = result.toArray();
  
  if (rows.length > 0 && rows[0].count === 0) {
    // Insert demo venue
    await conn.exec(`
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
        await conn.exec(`
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
  }
}

// Export database functions
export async function fetchVenue(venueId: string): Promise<Venue | null> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`
    SELECT * FROM venues WHERE id = ?
  `);
  const result = await stmt.query(venueId);
  
  const rows = result.toArray();
  if (rows.length === 0) return null;
  
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    timezone: row.timezone,
    settings: JSON.parse(row.settings),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  };
}

export async function fetchTimeSlots(venueId: string): Promise<TimeSlot[]> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const stmt = await conn.prepare(`
    SELECT * FROM time_slots WHERE venue_id = ? ORDER BY day_of_week, start_time
  `);
  const result = await stmt.query(venueId);
  
  return result.toArray().map(row => ({
    id: row.id,
    venue_id: row.venue_id,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    is_available: row.is_available,
    recurring: row.recurring,
    specific_date: row.specific_date ? new Date(row.specific_date) : undefined
  }));
}

export async function fetchBookings(venueId: string, date: Date): Promise<Booking[]> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const dateStr = date.toISOString().split('T')[0];
  
  const result = await conn.exec(`
    SELECT * FROM bookings 
    WHERE venue_id = '${venueId}' 
    AND DATE(start_time) = '${dateStr}'
    ORDER BY start_time
  `);
  
  return result.toArray().map(row => ({
    id: row.id,
    venue_id: row.venue_id,
    user_name: row.user_name,
    user_email: row.user_email,
    user_phone: row.user_phone,
    start_time: new Date(row.start_time),
    end_time: new Date(row.end_time),
    status: row.status,
    custom_data: row.custom_data ? JSON.parse(row.custom_data) : undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  const id = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await conn.exec(`
    INSERT INTO bookings (id, venue_id, user_name, user_email, user_phone, start_time, end_time, status, custom_data)
    VALUES (
      '${id}',
      '${booking.venue_id}',
      '${booking.user_name}',
      '${booking.user_email}',
      ${booking.user_phone ? `'${booking.user_phone}'` : 'NULL'},
      '${booking.start_time.toISOString()}',
      '${booking.end_time.toISOString()}',
      '${booking.status}',
      ${booking.custom_data ? `'${JSON.stringify(booking.custom_data)}'` : 'NULL'}
    )
  `);
  
  // Fetch and return the created booking
  const result = await conn.exec(`SELECT * FROM bookings WHERE id = '${id}'`);
  const row = result.toArray()[0];
  
  return {
    id: row.id,
    venue_id: row.venue_id,
    user_name: row.user_name,
    user_email: row.user_email,
    user_phone: row.user_phone,
    start_time: new Date(row.start_time),
    end_time: new Date(row.end_time),
    status: row.status,
    custom_data: row.custom_data ? JSON.parse(row.custom_data) : undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  };
}

export async function cancelBooking(bookingId: string): Promise<void> {
  if (!conn) await initializeDuckDB();
  if (!conn) throw new Error('Database connection not initialized');
  
  await conn.exec(`
    UPDATE bookings 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = '${bookingId}'
  `);
}