/**
 * Get a formatted label for a user role
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'super_user':
      return 'Super User';
    case 'user':
      return 'User';
    default:
      return role;
  }
}

/**
 * Get role badge color classes based on role type
 */
export function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'super_user':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'user':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
