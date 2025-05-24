'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { BookingSlot, Booking } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface BookingFormProps {
  venueId: string;
  selectedDate: Date;
  selectedSlot: BookingSlot;
  onSubmit: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export default function BookingForm({ 
  venueId, 
  selectedDate, 
  selectedSlot, 
  onSubmit, 
  onCancel 
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        venue_id: venueId,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        status: 'confirmed',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Complete Your Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm">
              <span className="font-medium">Time:</span> {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              type="text"
              id="name"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              type="email"
              id="email"
              required
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              type="tel"
              id="phone"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}