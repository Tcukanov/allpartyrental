"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProfileRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard immediately
    router.replace('/admin/dashboard');
  }, [router]);
  
  return (
    <div>
      Redirecting to dashboard...
    </div>
  );
} 