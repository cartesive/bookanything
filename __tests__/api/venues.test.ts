import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/venues/route';
import * as serverDatabase from '@/lib/server-database';

// Mock the server database
jest.mock('@/lib/server-database');
const mockServerDatabase = serverDatabase as jest.Mocked<typeof serverDatabase>;

describe('/api/venues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/venues', () => {
    it('should return all venues', async () => {
      const mockVenues = [
        {
          id: 'venue-1',
          name: 'Test Venue',
          description: 'A test venue',
          timezone: 'UTC',
          settings: { booking_duration_minutes: 60 },
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockServerDatabase.getAllVenuesServer.mockResolvedValue(mockVenues);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockVenues);
      expect(mockServerDatabase.getAllVenuesServer).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching venues', async () => {
      mockServerDatabase.getAllVenuesServer.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch venues' });
    });
  });

  describe('POST /api/venues', () => {
    it('should create a new venue', async () => {
      const newVenue = {
        id: 'venue-1',
        name: 'New Venue',
        description: 'A new venue',
        timezone: 'America/New_York',
        settings: { booking_duration_minutes: 60 },
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockServerDatabase.createVenueServer.mockResolvedValue(newVenue);

      const request = new NextRequest('http://localhost:3000/api/venues', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Venue',
          description: 'A new venue',
          timezone: 'America/New_York',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newVenue);
      expect(mockServerDatabase.createVenueServer).toHaveBeenCalledWith({
        name: 'New Venue',
        description: 'A new venue',
        timezone: 'America/New_York',
        settings: {
          booking_duration_minutes: 60,
          advance_booking_days: 14,
          cancellation_minutes: 120,
          max_bookings_per_user: 2,
        },
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/venues', {
        method: 'POST',
        body: JSON.stringify({
          description: 'A venue without name',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Name and timezone are required' });
      expect(mockServerDatabase.createVenueServer).not.toHaveBeenCalled();
    });

    it('should handle database errors when creating venue', async () => {
      mockServerDatabase.createVenueServer.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/venues', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Venue',
          timezone: 'UTC',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create venue' });
    });
  });
});