import { NextRequest, NextResponse } from 'next/server';
import { fetchAllBookingsServer, createBookingServer, getBookingStatsServer } from '@/lib/server-database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const params = await context.params;
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      const bookingStats = await getBookingStatsServer(params.venueId);
      return NextResponse.json(bookingStats);
    }

    const bookings = await fetchAllBookingsServer(
      params.venueId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      start_time,
      end_time,
      notes,
      status = 'pending'
    } = body;

    if (!customer_name || !customer_email || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'customer_name, customer_email, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    const booking = await createBookingServer({
      venue_id: params.venueId,
      customer_name,
      customer_email,
      customer_phone,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      status,
      notes
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}