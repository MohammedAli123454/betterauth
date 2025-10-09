'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import Sidebar from './Sidebar';
import { CurrentUserProvider } from './CurrentUserProvider';

type DashboardLayoutProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_user' | 'user';
};

type SessionUser = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  image?: string | null;
};

export default function DashboardLayout({
  children,
  requiredRole,
}: DashboardLayoutProps) {
  const router = useRouter();

  const {
    data: sessionUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['session', 'current-user'],
    queryFn: async (): Promise<SessionUser | null> => {
      const session = await authClient.getSession();

      if (!session?.data?.user) {
        return null;
      }

      const rawUser = session.data.user as {
        id: string;
        email: string;
        role?: string | null;
        name?: string | null;
        image?: string | null;
      };

      return {
        id: rawUser.id,
        email: rawUser.email,
        role: rawUser.role ?? 'user',
        name: rawUser.name ?? null,
        image: rawUser.image ?? null,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !sessionUser && !isError) {
      router.replace('/login');
    }
  }, [isLoading, sessionUser, router, isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  const isAccessDenied =
    requiredRole === 'admin' && sessionUser.role !== 'admin';

  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            You do not have sufficient permissions to access this resource.
            Administrator privileges are required.
          </p>
          <button
            onClick={() => router.replace('/employees')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <CurrentUserProvider user={sessionUser}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar currentUser={sessionUser} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </CurrentUserProvider>
  );
}
