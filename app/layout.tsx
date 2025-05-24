import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BookAnything - Simple Drop-in Booking System',
  description: 'A flexible booking system for any venue or service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}