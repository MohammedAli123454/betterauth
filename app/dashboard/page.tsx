'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const result = await authClient.getSession();

      if (!result?.data) {
        router.push('/login');
        return;
      }

      const user = result.data.user;

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/employees');
      }
    };

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
