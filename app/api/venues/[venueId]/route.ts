import { NextRequest, NextResponse } from 'next/server';
import { fetchVenueServer, updateVenueServer } from '@/lib/server-database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const params = await context.params;
  try {
    const venue = await fetchVenueServer(params.venueId);
    
    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { name, description, timezone, settings } = body;

    await updateVenueServer(params.venueId, {
      name,
      description,
      timezone,
      settings
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { error: 'Failed to update venue' },
      { status: 500 }
    );
  }
}