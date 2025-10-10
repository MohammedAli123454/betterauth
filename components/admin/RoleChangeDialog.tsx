import { User } from '@/types/admin';
import { getRoleLabel, getRoleBadgeClasses } from '@/lib/admin-utils';
import { Loader2 } from 'lucide-react';

interface RoleChangeDialogProps {
  user: User;
  newRole: string;
  onNewRoleChange: (role: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function RoleChangeDialog({
  user,
  newRole,
  onNewRoleChange,
  onConfirm,
  onCancel,
  isLoading,
}: RoleChangeDialogProps) {
  const isRoleChanged = user.role !== newRole;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Change User Role</h2>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Do you want to change the role for <strong>{user.name || user.email}</strong>?
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current Role:</span>
              <span
                className={`text-sm rounded-full px-3 py-1 font-medium border ${getRoleBadgeClasses(
                  user.role
                )}`}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">New Role:</span>
              <select
                value={newRole}
                onChange={(e) => onNewRoleChange(e.target.value)}
                disabled={isLoading}
                className="text-sm rounded-lg px-3 py-1.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="user">User</option>
                <option value="super_user">Super User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isRoleChanged || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              'Confirm Change'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
