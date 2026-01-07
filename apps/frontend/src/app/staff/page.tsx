'use client';

import * as React from 'react';
import StaffDashboard from '@/features/staff/components/StaffDashboard';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
        router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center">Memuat...</div>;

  return <StaffDashboard />;
}