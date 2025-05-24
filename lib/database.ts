import { Database } from 'duckdb-async';
import { readFileSync } from 'fs';
import path from 'path';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.create(':memory:');
    await initializeSchema();
  }
  return db;
}

async function initializeSchema() {
  if (!db) throw new Error('Database not initialized');
  
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    await db.run(statement + ';');
  }
}

export async function seedDemoData() {
  const db = await getDatabase();
  
  // Insert demo venue
  await db.run(`
    INSERT INTO venues (id, name, description, timezone, settings)
    VALUES (
      'demo-tennis-court',
      'Community Tennis Court',
      'Local tennis court available for booking',
      'America/New_York',
      '{
        "booking_duration_minutes": 60,
        "advance_booking_days": 14,
        "cancellation_minutes": 120,
        "max_bookings_per_user": 2
      }'
    )
  `);
  
  // Insert time slots (9 AM to 6 PM, Monday to Friday)
  for (let day = 1; day <= 5; day++) {
    for (let hour = 9; hour < 18; hour++) {
      await db.run(`
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