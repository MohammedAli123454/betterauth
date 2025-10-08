'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function UnauthorizedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user?.role) {
        setUserRole(session.data.user.role);
      }
    };
    getUser();
  }, []);

  const handleGoToDashboard = () => {
    if (userRole === 'admin') {
      router.push('/admin');
    } else if (userRole === 'super_user' || userRole === 'user') {
      router.push('/employees');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
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

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>

          {from && (
            <p className="text-sm text-gray-500 mb-6">
              Requested page: <span className="font-mono font-medium">{from}</span>
            </p>
          )}

          {/* Role Info */}
          {userRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Your role:</span>{' '}
                <span className="px-2 py-1 bg-blue-100 rounded text-xs font-semibold uppercase">
                  {userRole === 'super_user' ? 'Super User' : userRole}
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {userRole === 'user' && 'You have view-only access'}
                {userRole === 'super_user' && 'You can view and create resources'}
                {userRole === 'admin' && 'This page is not accessible even with admin privileges'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
