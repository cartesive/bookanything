import { Database } from 'duckdb-async';
import {
  getServerDatabase,
  fetchVenueServer,
  createVenueServer,
  createTimeSlotServer,
  fetchAllBookingsServer,
  getBookingStatsServer,
} from '@/lib/server-database';

// Mock duckdb-async
jest.mock('duckdb-async');
const MockDatabase = Database as jest.MockedClass<typeof Database>;

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}));

describe('server-database', () => {
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      run: jest.fn(),
      all: jest.fn(),
    } as any;
    
    MockDatabase.create = jest.fn().mockResolvedValue(mockDb);
  });

  describe('getServerDatabase', () => {
    it('should create database and initialize schema', async () => {
      const db = await getServerDatabase();
      
      expect(MockDatabase.create).toHaveBeenCalledWith(
        expect.stringContaining('bookings.db')
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS venues')
      );
      expect(db).toBe(mockDb);
    });

    it('should return existing database on subsequent calls', async () => {
      const db1 = await getServerDatabase();
      const db2 = await getServerDatabase();
      
      expect(MockDatabase.create).toHaveBeenCalledTimes(1);
      expect(db1).toBe(db2);
    });
  });

  describe('fetchVenueServer', () => {
    it('should return venue when found', async () => {
      const mockVenueData = {
        id: 'test-venue',
        name: 'Test Venue',
        description: 'A test venue',
        timezone: 'UTC',
        settings: '{"booking_duration_minutes": 60}',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      mockDb.all.mockResolvedValue([mockVenueData]);
      
      const venue = await fetchVenueServer('test-venue');
      
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM venues WHERE id = ? AND is_active = true',
        ['test-venue']
      );
      expect(venue).toEqual({
        id: 'test-venue',
        name: 'Test Venue',
        description: 'A test venue',
        timezone: 'UTC',
        settings: { booking_duration_minutes: 60 },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should return null when venue not found', async () => {
      mockDb.all.mockResolvedValue([]);
      
      const venue = await fetchVenueServer('nonexistent');
      
      expect(venue).toBeNull();
    });
  });

  describe('createVenueServer', () => {
    it('should create a new venue', async () => {
      const venueData = {
        name: 'New Venue',
        description: 'A new venue',
        timezone: 'America/New_York',
        settings: { booking_duration_minutes: 60 },
      };
      
      // Mock crypto.randomUUID
      const mockUUID = 'test-uuid';
      global.crypto = { randomUUID: jest.fn(() => mockUUID) } as any;
      
      const venue = await createVenueServer(venueData);
      
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO venues'),
        expect.arrayContaining([
          mockUUID,
          'New Venue',
          'A new venue',
          'America/New_York',
          JSON.stringify({ booking_duration_minutes: 60 }),
        ])
      );
      
      expect(venue).toEqual({
        ...venueData,
        id: mockUUID,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });
  });

  describe('createTimeSlotServer', () => {
    it('should create a new time slot', async () => {
      const timeSlotData = {
        venue_id: 'test-venue',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '10:00:00',
        is_available: true,
      };
      
      const mockUUID = 'timeslot-uuid';
      global.crypto = { randomUUID: jest.fn(() => mockUUID) } as any;
      
      const timeSlot = await createTimeSlotServer(timeSlotData);
      
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO time_slots'),
        expect.arrayContaining([
          mockUUID,
          'test-venue',
          1,
          '09:00:00',
          '10:00:00',
          true,
          1,
        ])
      );
      
      expect(timeSlot).toEqual({
        ...timeSlotData,
        id: mockUUID,
        created_at: expect.any(Date),
      });
    });
  });

  describe('fetchAllBookingsServer', () => {
    it('should fetch all bookings for a venue', async () => {
      const mockBookingData = {
        id: 'booking-1',
        venue_id: 'test-venue',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        start_time: '2024-01-15T09:00:00Z',
        end_time: '2024-01-15T10:00:00Z',
        status: 'pending',
        notes: 'Test booking',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      mockDb.all.mockResolvedValue([mockBookingData]);
      
      const bookings = await fetchAllBookingsServer('test-venue');
      
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM bookings WHERE venue_id = ? ORDER BY start_time DESC',
        ['test-venue']
      );
      
      expect(bookings).toHaveLength(1);
      expect(bookings[0]).toEqual({
        id: 'booking-1',
        venue_id: 'test-venue',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        status: 'pending',
        notes: 'Test booking',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should filter bookings by date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-16T00:00:00Z');
      
      mockDb.all.mockResolvedValue([]);
      
      await fetchAllBookingsServer('test-venue', startDate, endDate);
      
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM bookings WHERE venue_id = ? AND start_time >= ? AND start_time <= ? ORDER BY start_time DESC',
        ['test-venue', startDate.toISOString(), endDate.toISOString()]
      );
    });
  });

  describe('getBookingStatsServer', () => {
    it('should return booking statistics', async () => {
      const mockStatsData = {
        total: 10,
        pending: 3,
        confirmed: 6,
        cancelled: 1,
      };
      
      const mockTodayData = { count: 2 };
      const mockWeekData = { count: 5 };
      
      mockDb.all
        .mockResolvedValueOnce([mockStatsData])
        .mockResolvedValueOnce([mockTodayData])
        .mockResolvedValueOnce([mockWeekData]);
      
      const stats = await getBookingStatsServer('test-venue');
      
      expect(stats).toEqual({
        total: 10,
        pending: 3,
        confirmed: 6,
        cancelled: 1,
        todayBookings: 2,
        weekBookings: 5,
        monthlyRevenue: 0,
      });
      
      expect(mockDb.all).toHaveBeenCalledTimes(3);
    });
  });
});