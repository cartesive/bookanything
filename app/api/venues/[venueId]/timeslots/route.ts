import { NextRequest, NextResponse } from 'next/server';
import { fetchTimeSlotsServer, createTimeSlotServer } from '@/lib/server-database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const params = await context.params;
  try {
    const timeSlots = await fetchTimeSlotsServer(params.venueId);
    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
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
    const { day_of_week, start_time, end_time, is_available = true } = body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      );
    }

    const timeSlot = await createTimeSlotServer({
      venue_id: params.venueId,
      day_of_week,
      start_time,
      end_time,
      is_available
    });

    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}