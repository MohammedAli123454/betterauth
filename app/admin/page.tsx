'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { authClient } from '@/lib/auth-client';
import { useCurrentUser } from '@/components/CurrentUserProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { UsersTable } from '@/components/admin/UsersTable';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { BarLoader } from 'react-spinners';
import {
  User,
  createUserSchema,
  editUserSchema,
  CreateUserFormData,
  EditUserFormData,
} from '@/types/admin';

function AdminPageContent() {
  const currentUser = useCurrentUser();
  const currentUserRole = currentUser.role;
  const isAdmin = currentUserRole === 'admin';
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    user: User;
    newRole: string;
  } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successUserName, setSuccessUserName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const queryClient = useQueryClient();

  // React Hook Form for create user
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    setError: setCreateError,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
  });

  // React Hook Form for edit user
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors, isSubmitting: isEditing },
    reset: resetEdit,
    setValue: setEditValue,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const { data: usersData, isLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin');

        if (!response.ok) {
          let errorMessage = 'Failed to fetch users';
          try {
            const result = await response.json();
            errorMessage = result.error || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return (result.users ?? []) as User[];
      } catch (error) {
        console.error('[Users Query Error]:', error);
        throw error;
      }
    },
    enabled: isAdmin,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (usersError instanceof Error) {
      // Error will be shown in UI via query state
      console.error('Failed to load users:', usersError.message);
    }
  }, [usersError]);

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormData & { tempId: string }) => {
      if (!isAdmin) {
        throw new Error('Access Denied: Only administrators can create users.');
      }

      // Set loading state at the start
      setIsCreatingUser(true);

      // Add minimum delay to ensure loading state is visible
      const [result] = await Promise.all([
        authClient.admin.createUser({
          email: userData.email,
          name: userData.name,
          password: userData.password,
          data: {
            role: userData.role,
            emailVerified: true,
          },
        }),
        new Promise(resolve => setTimeout(resolve, 500)), // Minimum 500ms delay for feedback
      ]);

      // Log the full result to debug
      console.log('[Create User Result]', result);

      if (result.error) {
        // Log the error structure to understand it better
        console.warn('[Create User Error - Full]', result.error);
        console.warn('[Create User Error - Stringified]', JSON.stringify(result.error, null, 2));

        // Extract meaningful error message from better-auth error response
        const error = result.error as any;
        let errorMessage = error.message || 'Failed to create user';

        // Check for status code indicating duplicate
        if (error.status === 400 || error.statusCode === 400) {
          errorMessage = 'A user with this email already exists';
        }

        // Also check message content
        if (errorMessage.toLowerCase().includes('unique') ||
            errorMessage.toLowerCase().includes('duplicate') ||
            errorMessage.toLowerCase().includes('already exists')) {
          errorMessage = 'A user with this email already exists';
        }

        throw new Error(errorMessage);
      }

      return { result, tempId: userData.tempId };
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      // Add user with temp ID
      queryClient.setQueryData(['users'], (old: User[] = []) => [
        ...old,
        {
          id: newUser.tempId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: true,
        },
      ]);

      return { previousUsers, tempId: newUser.tempId };
    },
    onError: (error, _newUser, context) => {
      // Reset loading state
      setIsCreatingUser(false);

      // Remove from pending saves
      if (context?.tempId) {
        setPendingSaves((prev) => {
          const newSet = new Set(prev);
          newSet.delete(context.tempId);
          return newSet;
        });
      }

      // Rollback optimistic update
      queryClient.setQueryData(['users'], context?.previousUsers);

      if (error.message?.toLowerCase().includes('already exists')) {
        setCreateError('email', {
          type: 'manual',
          message: 'User already exists with this email. Choose another email.',
        });
      }
    },
    onSuccess: (data, _variables, context) => {
      // Reset loading state
      setIsCreatingUser(false);

      // Remove from pending saves
      if (context?.tempId) {
        setPendingSaves((prev) => {
          const newSet = new Set(prev);
          newSet.delete(context.tempId);
          return newSet;
        });
      }

      // Replace temp user with real user from server
      queryClient.setQueryData(['users'], (old: User[] = []) => {
        const filtered = old.filter((u) => u.id !== context?.tempId);
        if (data.result.data?.user) {
          return [
            ...filtered,
            {
              id: data.result.data.user.id,
              email: data.result.data.user.email,
              name: data.result.data.user.name,
              role: data.result.data.user.role as string,
              emailVerified: data.result.data.user.emailVerified as boolean,
            },
          ];
        }
        return filtered;
      });

      // Show inline success message
      setSuccessUserName(data.result.data?.user?.name || data.result.data?.user?.email || 'User');
      setShowSuccessMessage(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      resetCreate();
      setShowCreateForm(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      if (!isAdmin) {
        throw new Error('Access Denied: Only administrators can update users.');
      }

      // Handle role updates through better-auth
      if (updates.role) {
        await authClient.admin.setRole({
          userId,
          role: updates.role as 'user' | 'admin',
        });
      }

      // Handle name and email updates through custom API
      if (updates.name !== undefined || updates.email !== undefined) {
        const response = await fetch('/api/admin/update-user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            name: updates.name,
            email: updates.email,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to update user');
        }

        const result = await response.json();
        return { userId, updates, user: result.user };
      }

      return { userId, updates };
    },
    onMutate: async ({ userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      queryClient.setQueryData(['users'], (old: User[] = []) =>
        old.map((user) => (user.id === userId ? { ...user, ...updates } : user))
      );

      return { previousUsers };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['users'], context?.previousUsers);
      console.error('Failed to update user:', error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setShowEditModal(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) {
        throw new Error('Access Denied: Only administrators can delete users.');
      }

      await authClient.admin.removeUser({ userId });
      return userId;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      queryClient.setQueryData(['users'], (old: User[] = []) =>
        old.filter((user) => user.id !== userId)
      );

      return { previousUsers };
    },
    onError: (error, _userId, context) => {
      queryClient.setQueryData(['users'], context?.previousUsers);
      console.error('Failed to delete user:', error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const onCreateUser = async (data: CreateUserFormData) => {
    // Generate temp ID for optimistic update
    const tempId = 'temp-' + Date.now();

    // Add to pending saves immediately
    setPendingSaves((prev) => new Set(prev).add(tempId));

    // Trigger mutation with temp ID (happens in background)
    createUserMutation.mutate({ ...data, tempId });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleRoleClick = (user: User) => {
    setRoleChangeDialog({ user, newRole: user.role });
  };

  const confirmRoleChange = async () => {
    if (roleChangeDialog) {
      updateUserMutation.mutate(
        {
          userId: roleChangeDialog.user.id,
          updates: { role: roleChangeDialog.newRole },
        },
        {
          onSettled: () => {
            // Close dialog after mutation completes (success or error)
            setRoleChangeDialog(null);
          },
        }
      );
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditValue('name', user.name || '');
    setEditValue('email', user.email);
    setShowEditModal(true);
  };

  const onUpdateUser = async (data: EditUserFormData) => {
    if (!editingUser) return;

    updateUserMutation.mutate({
      userId: editingUser.id,
      updates: {
        name: data.name,
        email: data.email,
      },
    });
  };

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
  };

  const handlePasswordChanged = () => {
    // Password reset success - no toast needed
  };

  return (
    <div className="p-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-900">
              User Registered Successfully
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {successUserName} has been added to the system and can now log in.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Create User Button */}
      {!showCreateForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create New User
          </button>
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleSubmitCreate(onCreateUser)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  {...registerCreate('name')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {createErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  {...registerCreate('email')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {createErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter password (min 8 characters)"
                  {...registerCreate('password')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {createErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  {...registerCreate('confirmPassword')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {createErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  {...registerCreate('role')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.role ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="user">User (View Only)</option>
                  <option value="super_user">Super User (View + Create)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
                {createErrors.role && (
                  <p className="mt-1 text-xs text-red-600">{createErrors.role.message}</p>
                )}
              </div>

              <div className="flex gap-3 items-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {isCreatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetCreate();
                  }}
                  disabled={isCreatingUser}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Loading Bar */}
            {isCreatingUser && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Creating user account...</p>
                <BarLoader color="#3B82F6" width="100%" />
              </div>
            )}
          </form>
        </div>
      )}

      {/* Users Table */}
      <UsersTable
        users={usersData}
        isLoading={isLoading}
        pendingSaves={pendingSaves}
        isUpdating={updateUserMutation.isPending}
        isDeleting={deleteUserMutation.isPending}
        onRoleClick={handleRoleClick}
        onEdit={handleEdit}
        onResetPassword={handleResetPassword}
        onDelete={handleDeleteUser}
      />

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetEdit();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onUpdateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  {...registerEdit('name')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    editErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {editErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{editErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...registerEdit('email')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    editErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {editErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{editErrors.email.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetEdit();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing || updateUserMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {(isEditing || updateUserMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {(isEditing || updateUserMutation.isPending) ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${
          userToDelete?.name || userToDelete?.email
        }? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Change Password Dialog */}
      {userToResetPassword && (
        <ChangePasswordDialog
          open={!!userToResetPassword}
          onOpenChange={(open) => !open && setUserToResetPassword(null)}
          userId={userToResetPassword.id}
          userName={userToResetPassword.name}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* Change Role Dialog */}
      {roleChangeDialog && (
        <RoleChangeDialog
          user={roleChangeDialog.user}
          newRole={roleChangeDialog.newRole}
          onNewRoleChange={(newRole) =>
            setRoleChangeDialog({ ...roleChangeDialog, newRole })
          }
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleChangeDialog(null)}
          isLoading={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardLayout requiredRole="admin">
      <AdminPageContent />
    </DashboardLayout>
  );
}
