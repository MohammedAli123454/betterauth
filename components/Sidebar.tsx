'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';

type SidebarProps = {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export default function Sidebar({ currentUser }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const menuItems = [
    {
      name: 'Admin Dashboard',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      adminOnly: false,
    },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Welcome back!</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {currentUser.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentUser.role === 'admin'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const canAccess = !item.adminOnly || currentUser.role === 'admin';

            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    if (canAccess) {
                      router.push(item.path);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : canAccess
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!canAccess}
                  title={
                    !canAccess
                      ? 'Administrator privileges required'
                      : ''
                  }
                >
                  <span className={!canAccess ? 'opacity-50' : ''}>
                    {item.icon}
                  </span>
                  <span className={`flex-1 text-left ${!canAccess ? 'opacity-50' : ''}`}>
                    {item.name}
                  </span>
                  {!canAccess && (
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600/10 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
}
