'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { ClipboardList, Users, FileText, LogOut, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from './ConfirmDialog';

type SidebarProps = {
  currentUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

export default function Sidebar({ currentUser }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const menuItems = [
    {
      name: 'Admin Dashboard',
      path: '/admin',
      icon: <ClipboardList className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: <Users className="w-5 h-5" />,
      adminOnly: false,
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: <FileText className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Sign out from Better Auth
      await authClient.signOut();

      // Clear all React Query cache to prevent stale data
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const displayName = currentUser.name ?? currentUser.email;
  const initial = (currentUser.name ?? currentUser.email ?? '?')
    .charAt(0)
    .toUpperCase();

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
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
          </div>
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
                    <Lock className="w-4 h-4 text-red-400" />
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
          onClick={() => setShowSignOutDialog(true)}
          disabled={isSigningOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600/10 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={confirmSignOut}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
