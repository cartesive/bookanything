'use client';

import { useState, useEffect } from 'react';
import { Venue } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  ArrowLeft,
  Download
} from 'lucide-react';
import VenueManager from './VenueManager';
import TimeSlotManager from './TimeSlotManager';
import BookingsTable from './BookingsTable';
import { exportBookingsToCSV, generateBookingReport, downloadTextReport } from '@/lib/export-utils';

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  todayBookings: number;
  weekBookings: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'overview' | 'venue-detail'>('overview');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  useEffect(() => {
    if (selectedVenue && currentView === 'venue-detail') {
      loadVenueData(selectedVenue.id);
    }
  }, [selectedVenue, currentView]);

  async function loadOverviewData() {
    try {
      const venuesResponse = await fetch('/api/venues');
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData);
        
        // Load stats for first venue if available
        if (venuesData.length > 0) {
          const statsResponse = await fetch(`/api/venues/${venuesData[0].id}/bookings?stats=true`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVenueData(venueId: string) {
    try {
      const [statsResponse, bookingsResponse] = await Promise.all([
        fetch(`/api/venues/${venueId}/bookings?stats=true`),
        fetch(`/api/venues/${venueId}/bookings`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error('Failed to load venue data:', error);
    }
  }

  function handleVenueSelect(venue: Venue) {
    setSelectedVenue(venue);
    setCurrentView('venue-detail');
  }

  function handleBackToOverview() {
    setCurrentView('overview');
    setSelectedVenue(null);
  }

  async function handleStatusChange(bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') {
    if (!selectedVenue) return;

    try {
      const response = await fetch(`/api/venues/${selectedVenue.id}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadVenueData(selectedVenue.id);
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'venue-detail' && selectedVenue) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToOverview}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedVenue.name}</h1>
            <p className="text-muted-foreground mt-2">
              {selectedVenue.description || 'Venue management and configuration'}
            </p>
          </div>
        </div>

        {/* Stats Cards for Selected Venue */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayBookings}</div>
                <p className="text-xs text-muted-foreground">Bookings today</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="timeslots">Time Slots</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>
                      Manage bookings for {selectedVenue.name}
                    </CardDescription>
                  </div>
                  {bookings.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportBookingsToCSV(bookings, selectedVenue.name)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const report = generateBookingReport(bookings);
                          downloadTextReport(report, `${selectedVenue.name}-report-${new Date().toISOString().split('T')[0]}.txt`);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings found.</p>
                  </div>
                ) : (
                  <BookingsTable bookings={bookings} onStatusChange={handleStatusChange} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeslots" className="space-y-6">
            <TimeSlotManager venueId={selectedVenue.id} venueName={selectedVenue.name} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Settings</CardTitle>
                <CardDescription>
                  Configure booking rules and venue information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Booking Duration</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVenue.settings.booking_duration_minutes} minutes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Advance Booking</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVenue.settings.advance_booking_days} days
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Cancellation Window</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVenue.settings.cancellation_minutes} minutes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Max Bookings per User</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedVenue.settings.max_bookings_per_user} bookings
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      To edit these settings, use the venue management interface.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage venues, bookings, and system settings
        </p>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{venues.length}</div>
              <p className="text-xs text-muted-foreground">Active venues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
              <p className="text-xs text-muted-foreground">Bookings today</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="venues" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-6">
          <VenueManager onVenueSelect={handleVenueSelect} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Booking Analytics
              </CardTitle>
              <CardDescription>
                Detailed insights into your booking performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">View booking trends, revenue reports, and customer insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure global system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>System settings coming soon</p>
                <p className="text-sm">Configure email templates, payment settings, and more</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}