import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Code, Building2, Car, Camera, Tent, Wrench } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple Booking System for Everyone
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Drop-in booking solution for tennis courts, meeting rooms, equipment rentals, 
            and any resource that needs scheduling
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/demo">
                Try Demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/embed">
                Get Embed Code
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Easy Calendar Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intuitive date picker with clear availability indicators. Users can quickly find and book open slots.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Flexible Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Works with static hosting. Powered by DuckDB WebAssembly for production-ready SQL database functionality directly in the browser.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Simple Embed</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Add booking functionality to any website with a single script tag. Fully customizable styling.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '🎾', label: 'Tennis Courts' },
                { icon: '🏢', label: 'Meeting Rooms' },
                { icon: '🏋️', label: 'Gym Equipment' },
                { icon: '📚', label: 'Study Spaces' },
                { icon: '🚗', label: 'Parking Spots' },
                { icon: '📸', label: 'Photo Studios' },
                { icon: '🎪', label: 'Event Spaces' },
                { icon: '🛠️', label: 'Tool Libraries' }
              ].map((item) => (
                <div key={item.label} className="text-center py-3 px-4 bg-muted rounded-lg">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}