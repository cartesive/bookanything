import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatusServer } from '@/lib/server-database';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ venueId: string; bookingId: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status, admin_notes } = body;

    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, confirmed, cancelled)' },
        { status: 400 }
      );
    }

    await updateBookingStatusServer(params.bookingId, status, admin_notes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}