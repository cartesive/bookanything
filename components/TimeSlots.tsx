'use client';

import { format } from 'date-fns';
import { BookingSlot } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotsProps {
  slots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  onSlotSelect: (slot: BookingSlot) => void;
}

export default function TimeSlots({ slots, selectedSlot, onSlotSelect }: TimeSlotsProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot, index) => {
        const isSelected = selectedSlot && 
          slot.start.getTime() === selectedSlot.start.getTime();
        
        return (
          <Button
            key={index}
            onClick={() => slot.available && onSlotSelect(slot)}
            disabled={!slot.available}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "w-full",
              !slot.available && "opacity-50"
            )}
          >
            {format(slot.start, 'h:mm a')}
          </Button>
        );
      })}
    </div>
  );
}