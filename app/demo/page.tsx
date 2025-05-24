'use client';

import BookingWidget from '@/components/BookingWidget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Database, HardDrive } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function DemoPage() {
  const searchParams = useSearchParams();
  const useDuckDB = searchParams.get('duckdb') === 'true';

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Book a Tennis Court</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience our booking system with this demo tennis court. Select a date and time to make a reservation.
          </p>
          
          <div className="mt-6 space-y-4">
            <Badge variant="secondary" className="gap-1">
              {useDuckDB ? (
                <>
                  <Database className="w-3 h-3" />
                  Using DuckDB WebAssembly
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3" />
                  Using LocalStorage
                </>
              )}
            </Badge>
            
            <div className="flex gap-2 justify-center">
              <Button
                asChild
                variant={!useDuckDB ? "default" : "outline"}
                size="sm"
              >
                <Link href="/demo">LocalStorage</Link>
              </Button>
              <Button
                asChild
                variant={useDuckDB ? "default" : "outline"}
                size="sm"
              >
                <Link href="/demo?duckdb=true">DuckDB</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <BookingWidget venueId="demo-tennis-court" />
      </div>
    </div>
  );
}