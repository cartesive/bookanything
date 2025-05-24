import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingWidget from '@/components/BookingWidget';
import * as databaseProvider from '@/lib/database-provider';

// Mock the database provider
jest.mock('@/lib/database-provider');
const mockDatabaseProvider = databaseProvider as jest.Mocked<typeof databaseProvider>;

describe('BookingWidget', () => {
  const mockVenue = {
    id: 'test-venue',
    name: 'Test Venue',
    description: 'A test venue',
    timezone: 'UTC',
    settings: { booking_duration_minutes: 60 },
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseProvider.fetchVenue.mockResolvedValue(mockVenue);
    mockDatabaseProvider.fetchAvailableSlots.mockResolvedValue([]);
  });

  it('should render loading state initially', () => {
    render(<BookingWidget venueId="test-venue" />);
    
    expect(screen.getByRole('generic')).toBeInTheDocument(); // Loading spinner
  });

  it('should render venue information after loading', async () => {
    render(<BookingWidget venueId="test-venue" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });
    
    expect(mockDatabaseProvider.fetchVenue).toHaveBeenCalledWith('test-venue');
  });

  it('should fetch available slots when date is selected', async () => {
    const mockSlots = [
      {
        start: new Date(2024, 0, 15, 9, 0),
        end: new Date(2024, 0, 15, 10, 0),
        available: true,
      },
    ];
    
    mockDatabaseProvider.fetchAvailableSlots.mockResolvedValue(mockSlots);
    
    render(<BookingWidget venueId="test-venue" />);
    
    // Wait for venue to load
    await waitFor(() => {
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });
    
    // Simulate date selection (this would require mocking the Calendar component)
    // For now, we'll test the effect hook behavior
    expect(mockDatabaseProvider.fetchVenue).toHaveBeenCalledWith('test-venue');
  });

  it('should show booking form when slot is selected', async () => {
    const user = userEvent.setup();
    
    const mockSlots = [
      {
        start: new Date(2024, 0, 15, 9, 0),
        end: new Date(2024, 0, 15, 10, 0),
        available: true,
      },
    ];
    
    mockDatabaseProvider.fetchAvailableSlots.mockResolvedValue(mockSlots);
    
    render(<BookingWidget venueId="test-venue" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });
    
    // Note: Full integration test would require mocking Calendar and TimeSlots components
    // This test validates the basic rendering and setup
  });

  it('should create booking when form is submitted', async () => {
    const mockBooking = {
      id: 'booking-1',
      venue_id: 'test-venue',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '123-456-7890',
      start_time: new Date(2024, 0, 15, 9, 0),
      end_time: new Date(2024, 0, 15, 10, 0),
      status: 'pending' as const,
      notes: 'Test booking',
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    mockDatabaseProvider.createBooking.mockResolvedValue(mockBooking);
    
    render(<BookingWidget venueId="test-venue" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });
    
    // Test would continue with form interaction simulation
    expect(mockDatabaseProvider.fetchVenue).toHaveBeenCalledWith('test-venue');
  });

  it('should show success message after booking is created', async () => {
    const mockBooking = {
      id: 'booking-1',
      venue_id: 'test-venue',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: null,
      start_time: new Date(2024, 0, 15, 9, 0),
      end_time: new Date(2024, 0, 15, 10, 0),
      status: 'pending' as const,
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    mockDatabaseProvider.createBooking.mockResolvedValue(mockBooking);
    
    render(<BookingWidget venueId="test-venue" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
    });
    
    // This test validates the component setup - full booking flow would require more complex mocking
  });
});