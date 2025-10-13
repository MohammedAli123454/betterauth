import { User } from '@/types/admin';
import { getRoleLabel, getRoleBadgeClasses } from '@/lib/admin-utils';
import { Loader2, Pencil, KeyRound, Trash2, Users } from 'lucide-react';

interface UsersTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  pendingSaves: Set<string>;
  isUpdating: boolean;
  isDeleting: boolean;
  onRoleClick: (user: User) => void;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({
  users,
  isLoading,
  pendingSaves,
  isUpdating,
  isDeleting,
  onRoleClick,
  onEdit,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-48 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => {
              const isPending = pendingSaves.has(user.id);
              return (
                <tr
                  key={user.id}
                  className={`group hover:bg-gray-50 transition-all duration-150 ${
                    isPending ? 'bg-blue-50 animate-pulse' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* User Avatar with Initials */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {(user.name || user.email)
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {user.name || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 truncate">{user.email}</span>
                      </div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium whitespace-nowrap">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onRoleClick(user)}
                      disabled={isUpdating || isPending}
                      className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 font-semibold border cursor-pointer hover:opacity-80 transition-all ${getRoleBadgeClasses(
                        user.role
                      )} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {getRoleLabel(user.role)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.emailVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => onEdit(user)}
                      disabled={isPending}
                      title="Edit user"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm disabled:text-gray-400 disabled:border-gray-200 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => onResetPassword(user)}
                      disabled={isPending}
                      title="Reset password"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 hover:shadow-sm disabled:text-gray-400 disabled:border-gray-200 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Reset Password</span>
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      disabled={isDeleting || isPending}
                      title="Delete user"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 hover:shadow-sm disabled:text-gray-400 disabled:border-gray-200 disabled:bg-transparent disabled:cursor-not-allowed transition-all"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Delete</span>
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!users || users.length === 0) && !isLoading && (
          <div className="px-6 py-16 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No users yet</h3>
            <p className="text-sm text-gray-500">Get started by creating your first user</p>
          </div>
        )}
      </div>
    </div>
  );
}
