import { NextRequest, NextResponse } from 'next/server';
import { getAllVenuesServer, createVenueServer } from '@/lib/server-database';

export async function GET() {
  try {
    const venues = await getAllVenuesServer();
    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, timezone, settings } = body;

    if (!name || !timezone) {
      return NextResponse.json(
        { error: 'Name and timezone are required' },
        { status: 400 }
      );
    }

    const venue = await createVenueServer({
      name,
      description,
      timezone,
      settings: settings || {
        booking_duration_minutes: 60,
        advance_booking_days: 14,
        cancellation_minutes: 120,
        max_bookings_per_user: 2
      }
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: 'Failed to create venue' },
      { status: 500 }
    );
  }
}