import { Booking, Venue } from '@/types/database';

export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle dates and escape quotes
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportBookingsToCSV(bookings: Booking[], venueName: string) {
  const csvData = bookings.map(booking => ({
    'Booking ID': booking.id,
    'Customer Name': booking.customer_name,
    'Customer Email': booking.customer_email,
    'Customer Phone': booking.customer_phone || '',
    'Start Time': booking.start_time,
    'End Time': booking.end_time,
    'Status': booking.status,
    'Notes': booking.notes || '',
    'Created At': booking.created_at,
    'Updated At': booking.updated_at,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvData, `${venueName}-bookings-${timestamp}.csv`);
}

export function exportVenuesToCSV(venues: Venue[]) {
  const csvData = venues.map(venue => ({
    'Venue ID': venue.id,
    'Name': venue.name,
    'Description': venue.description || '',
    'Timezone': venue.timezone,
    'Booking Duration (minutes)': venue.settings.booking_duration_minutes,
    'Advance Booking (days)': venue.settings.advance_booking_days,
    'Cancellation Window (minutes)': venue.settings.cancellation_minutes,
    'Max Bookings per User': venue.settings.max_bookings_per_user,
    'Created At': venue.created_at,
    'Updated At': venue.updated_at,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvData, `venues-${timestamp}.csv`);
}

export function generateBookingReport(bookings: Booking[]): string {
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayBookings = bookings.filter(b => new Date(b.start_time) >= startOfToday).length;
  
  const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekBookings = bookings.filter(b => new Date(b.start_time) >= startOfWeek).length;

  return `
# Booking Report

Generated on: ${new Date().toLocaleDateString()}

## Summary
- Total Bookings: ${totalBookings}
- Confirmed: ${confirmedBookings} (${Math.round((confirmedBookings / totalBookings) * 100)}%)
- Pending: ${pendingBookings} (${Math.round((pendingBookings / totalBookings) * 100)}%)
- Cancelled: ${cancelledBookings} (${Math.round((cancelledBookings / totalBookings) * 100)}%)

## Recent Activity
- Today's Bookings: ${todayBookings}
- This Week's Bookings: ${weekBookings}

## Status Breakdown
${bookings.reduce((acc, booking) => {
  acc[booking.status] = (acc[booking.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>)}
  `.trim();
}

export function downloadTextReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}