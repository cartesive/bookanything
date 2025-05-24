import { NextRequest, NextResponse } from 'next/server';
import { updateTimeSlotServer, deleteTimeSlotServer } from '@/lib/server-database';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ venueId: string; timeSlotId: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { start_time, end_time, is_available } = body;

    await updateTimeSlotServer(params.timeSlotId, {
      start_time,
      end_time,
      is_available
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to update time slot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ venueId: string; timeSlotId: string }> }
) {
  const params = await context.params;
  try {
    await deleteTimeSlotServer(params.timeSlotId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete time slot' },
      { status: 500 }
    );
  }
}