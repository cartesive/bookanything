'use client';

import { useState } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminAuth from '@/components/admin/AdminAuth';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}