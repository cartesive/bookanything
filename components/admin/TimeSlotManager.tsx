'use client';

import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

interface TimeSlotManagerProps {
  venueId: string;
  venueName: string;
}

export default function TimeSlotManager({ venueId, venueName }: TimeSlotManagerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    is_available: true,
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    loadTimeSlots();
  }, [venueId]);

  async function loadTimeSlots() {
    try {
      const response = await fetch(`/api/venues/${venueId}/timeslots`);
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      }
    } catch (error) {
      console.error('Failed to load time slots:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:00',
      is_available: true,
    });
  }

  function openEditDialog(slot: TimeSlot) {
    setEditingSlot(slot);
    setFormData({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
    });
    setIsEditDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const payload = {
        day_of_week: formData.day_of_week,
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
        is_available: formData.is_available,
      };

      const url = editingSlot 
        ? `/api/venues/${venueId}/timeslots/${editingSlot.id}`
        : `/api/venues/${venueId}/timeslots`;
      const method = editingSlot ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadTimeSlots();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingSlot(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save time slot:', error);
    }
  }

  async function handleDelete(slotId: string) {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      const response = await fetch(`/api/venues/${venueId}/timeslots/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTimeSlots();
      }
    } catch (error) {
      console.error('Failed to delete time slot:', error);
    }
  }

  async function toggleAvailability(slot: TimeSlot) {
    try {
      const response = await fetch(`/api/venues/${venueId}/timeslots/${slot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_available: !slot.is_available,
        }),
      });

      if (response.ok) {
        await loadTimeSlots();
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  }

  function groupSlotsByDay() {
    const grouped = timeSlots.reduce((acc, slot) => {
      if (!acc[slot.day_of_week]) {
        acc[slot.day_of_week] = [];
      }
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {} as Record<number, TimeSlot[]>);

    // Sort slots within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDay();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Slot Management</h2>
          <p className="text-muted-foreground">
            Configure available time slots for {venueName}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Time Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Time Slot</DialogTitle>
              <DialogDescription>
                Add a new available time slot for {venueName}
              </DialogDescription>
            </DialogHeader>
            <TimeSlotForm
              formData={formData}
              setFormData={setFormData}
              daysOfWeek={daysOfWeek}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Create Time Slot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {daysOfWeek.map(({ value: dayValue, label: dayLabel }) => {
          const daySlots = groupedSlots[dayValue] || [];
          
          return (
            <Card key={dayValue}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {dayLabel}
                  <Badge variant="secondary">{daySlots.length} slots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {daySlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No time slots configured for {dayLabel}
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border ${
                          slot.is_available 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="w-3 h-3" />
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(slot)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(slot.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={slot.is_available ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {slot.is_available ? 'Available' : 'Disabled'}
                          </Badge>
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={() => toggleAvailability(slot)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {timeSlots.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No time slots configured</h3>
            <p className="text-muted-foreground mb-4">
              Add time slots to make {venueName} available for booking
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Time Slot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Slot</DialogTitle>
            <DialogDescription>
              Update time slot configuration
            </DialogDescription>
          </DialogHeader>
          <TimeSlotForm
            formData={formData}
            setFormData={setFormData}
            daysOfWeek={daysOfWeek}
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

interface TimeSlotFormProps {
  formData: any;
  setFormData: (data: any) => void;
  daysOfWeek: Array<{ value: number; label: string }>;
}

function TimeSlotForm({ formData, setFormData, daysOfWeek }: TimeSlotFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="day">Day of Week</Label>
        <Select
          value={formData.day_of_week.toString()}
          onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {daysOfWeek.map((day) => (
              <SelectItem key={day.value} value={day.value.toString()}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_available"
          checked={formData.is_available}
          onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
        />
        <Label htmlFor="is_available">Available for booking</Label>
      </div>
    </div>
  );
}