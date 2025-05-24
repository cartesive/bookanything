'use client';

import { format } from 'date-fns';
import { BookingSlot } from '@/types/database';

interface TimeSlotsProps {
  slots: BookingSlot[];
  selectedSlot: BookingSlot | null;
  onSlotSelect: (slot: BookingSlot) => void;
}

export default function TimeSlots({ slots, selectedSlot, onSlotSelect }: TimeSlotsProps) {
  if (slots.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Available Times</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot && 
            slot.start.getTime() === selectedSlot.start.getTime();
          
          return (
            <button
              key={index}
              onClick={() => slot.available && onSlotSelect(slot)}
              disabled={!slot.available}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${isSelected ? 'bg-blue-600 text-white' : ''}
                ${!isSelected && slot.available ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : ''}
                ${!slot.available ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
              `}
            >
              {format(slot.start, 'h:mm a')}
            </button>
          );
        })}
      </div>
    </div>
  );
}