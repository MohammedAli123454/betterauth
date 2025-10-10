import { User } from '@/types/admin';
import { getRoleLabel, getRoleBadgeClasses } from '@/lib/admin-utils';
import { Loader2 } from 'lucide-react';

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
        <div className="px-6 py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading users...</p>
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
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
                  className={`hover:bg-gray-50 transition-colors ${
                    isPending ? 'bg-blue-50 animate-pulse' : ''
                  }`}
                >
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onRoleClick(user)}
                      disabled={isUpdating || isPending}
                      className={`text-sm rounded-full px-3 py-1 font-medium border cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadgeClasses(
                        user.role
                      )} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {getRoleLabel(user.role)}
                    </button>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
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
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => onEdit(user)}
                      disabled={isPending}
                      className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onResetPassword(user)}
                      disabled={isPending}
                      className="text-purple-600 hover:text-purple-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      disabled={isDeleting || isPending}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!users || users.length === 0) && !isLoading && (
          <div className="px-6 py-12 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}
