'use client';

import BookingWidget from '@/components/BookingWidget';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Book a Tennis Court</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience our booking system with this demo tennis court. Select a date and time to make a reservation.
          </p>
          
          <div className="mt-6">
            <Badge variant="secondary" className="gap-1">
              <Database className="w-3 h-3" />
              Powered by DuckDB WebAssembly
            </Badge>
          </div>
        </div>
        
        <BookingWidget venueId="demo-tennis-court" />
      </div>
    </div>
  );
}