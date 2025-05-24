'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={previousMonth}
          variant="outline"
          size="icon"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          onClick={nextMonth}
          variant="outline"
          size="icon"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
            <Button
              key={index}
              onClick={() => !isPast && isAvailable && onDateSelect(day)}
              disabled={isPast || !isAvailable}
              variant={isSelected ? "default" : "ghost"}
              className={cn(
                "h-9 w-9 p-0 font-normal",
                isSelected && "text-primary-foreground",
                !isSelected && isCurrentDay && "bg-accent text-accent-foreground",
                (isPast || !isAvailable) && "text-muted-foreground opacity-50"
              )}
            >
              {format(day, 'd')}
            </Button>
          );
        })}
      </div>
    </div>
  );
}