'use client';

import { useState, useEffect } from 'react';
import { Venue } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface VenueManagerProps {
  onVenueSelect?: (venue: Venue) => void;
}

export default function VenueManager({ onVenueSelect }: VenueManagerProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'America/New_York',
    booking_duration_minutes: 60,
    advance_booking_days: 14,
    cancellation_minutes: 120,
    max_bookings_per_user: 2,
  });

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'UTC',
  ];

  useEffect(() => {
    loadVenues();
  }, []);

  async function loadVenues() {
    try {
      const response = await fetch('/api/venues');
      if (response.ok) {
        const data = await response.json();
        setVenues(data);
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      timezone: 'America/New_York',
      booking_duration_minutes: 60,
      advance_booking_days: 14,
      cancellation_minutes: 120,
      max_bookings_per_user: 2,
    });
  }

  function openEditDialog(venue: Venue) {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description || '',
      timezone: venue.timezone,
      booking_duration_minutes: venue.settings.booking_duration_minutes || 60,
      advance_booking_days: venue.settings.advance_booking_days || 14,
      cancellation_minutes: venue.settings.cancellation_minutes || 120,
      max_bookings_per_user: venue.settings.max_bookings_per_user || 2,
    });
    setIsEditDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        timezone: formData.timezone,
        settings: {
          booking_duration_minutes: formData.booking_duration_minutes,
          advance_booking_days: formData.advance_booking_days,
          cancellation_minutes: formData.cancellation_minutes,
          max_bookings_per_user: formData.max_bookings_per_user,
        },
      };

      const url = editingVenue ? `/api/venues/${editingVenue.id}` : '/api/venues';
      const method = editingVenue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadVenues();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingVenue(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save venue:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Venue Management</h2>
          <p className="text-muted-foreground">
            Create and configure venues for your booking system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Venue</DialogTitle>
              <DialogDescription>
                Configure a new venue for your booking system
              </DialogDescription>
            </DialogHeader>
            <VenueForm
              formData={formData}
              setFormData={setFormData}
              timezones={timezones}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Create Venue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{venue.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(venue)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              {venue.description && (
                <CardDescription>{venue.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{venue.timezone}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Badge variant="secondary">
                  {venue.settings.booking_duration_minutes}min slots
                </Badge>
                <Badge variant="secondary">
                  {venue.settings.advance_booking_days}d advance
                </Badge>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onVenueSelect?.(venue)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {venues.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No venues configured</h3>
            <p className="text-muted-foreground mb-4">
              Create your first venue to start accepting bookings
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>
              Update venue configuration and settings
            </DialogDescription>
          </DialogHeader>
          <VenueForm
            formData={formData}
            setFormData={setFormData}
            timezones={timezones}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VenueFormProps {
  formData: any;
  setFormData: (data: any) => void;
  timezones: string[];
}

function VenueForm({ formData, setFormData, timezones }: VenueFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Venue Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Community Tennis Court"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone *</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the venue"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold">Booking Settings</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Booking Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.booking_duration_minutes}
              onChange={(e) => setFormData({ 
                ...formData, 
                booking_duration_minutes: parseInt(e.target.value) || 60 
              })}
              min="15"
              max="480"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance">Advance Booking (days)</Label>
            <Input
              id="advance"
              type="number"
              value={formData.advance_booking_days}
              onChange={(e) => setFormData({ 
                ...formData, 
                advance_booking_days: parseInt(e.target.value) || 14 
              })}
              min="1"
              max="90"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation">Cancellation Window (minutes)</Label>
            <Input
              id="cancellation"
              type="number"
              value={formData.cancellation_minutes}
              onChange={(e) => setFormData({ 
                ...formData, 
                cancellation_minutes: parseInt(e.target.value) || 120 
              })}
              min="0"
              max="1440"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxBookings">Max Bookings per User</Label>
            <Input
              id="maxBookings"
              type="number"
              value={formData.max_bookings_per_user}
              onChange={(e) => setFormData({ 
                ...formData, 
                max_bookings_per_user: parseInt(e.target.value) || 2 
              })}
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}