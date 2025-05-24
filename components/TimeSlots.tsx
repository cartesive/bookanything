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
      <div className="bg-orange-50 rounded-lg p-8 text-center border border-orange-200">
        <svg className="w-8 h-8 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 text-sm">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot && 
            slot.start.getTime() === selectedSlot.start.getTime();
          
          return (
            <button
              key={index}
              onClick={() => slot.available && onSlotSelect(slot)}
              disabled={!slot.available}
              className={`
                px-3 py-2 rounded-lg font-medium text-sm transition-all border
                ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : ''}
                ${!isSelected && slot.available ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' : ''}
                ${!slot.available ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : ''}
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