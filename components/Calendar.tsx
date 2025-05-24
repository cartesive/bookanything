'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates?: Date[];
}

export default function Calendar({ selectedDate, onDateSelect, availableDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthDays, setMonthDays] = useState<Date[]>([]);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setMonthDays(days);
  }, [currentMonth]);

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const isDateAvailable = (date: Date) => {
    if (!availableDates) return true;
    return availableDates.some(d => isSameDay(d, date));
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isPastDate = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, index) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isAvailable = isDateAvailable(day);
          const isPast = isPastDate(day);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={index}
              onClick={() => !isPast && isAvailable && onDateSelect(day)}
              disabled={isPast || !isAvailable}
              className={`
                p-3 text-sm rounded-lg font-medium transition-all
                ${isSelected ? 'bg-blue-600 text-white' : ''}
                ${!isSelected && isCurrentDay ? 'bg-blue-50 text-blue-600' : ''}
                ${!isSelected && !isCurrentDay && isAvailable && !isPast ? 'hover:bg-gray-100' : ''}
                ${isPast || !isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}
                ${!isSelected && !isPast && isAvailable ? 'text-gray-700' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}