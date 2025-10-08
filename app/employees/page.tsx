'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
};

export default function EmployeesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
    hireDate: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user?.role) {
        setCurrentUserRole(session.data.user.role);
      }
    };
    getUser();
  }, []);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<Employee[]> => {
      const response = await fetch('/api/employees');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch employees');
      }

      return result.data.map((emp: any) => ({
        ...emp,
        salary: parseFloat(emp.salary),
      }));
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          salary: parseFloat(data.salary),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create employee');
      }

      return {
        ...result.data,
        salary: parseFloat(result.data.salary),
      };
    },
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] });
      const previousEmployees = queryClient.getQueryData(['employees']);

      queryClient.setQueryData(['employees'], (old: Employee[] = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          ...newEmployee,
          salary: parseFloat(newEmployee.salary),
        },
      ]);

      return { previousEmployees };
    },
    onError: (error, newEmployee, context) => {
      queryClient.setQueryData(['employees'], context?.previousEmployees);
      setMessage({ text: error.message || 'An unexpected error occurred', type: 'error' });
      toast.error('Failed to create employee', {
        description: error.message || 'An unexpected error occurred'
      });
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setFormData({
        name: '',
        email: '',
        position: '',
        department: '',
        salary: '',
        hireDate: '',
      });
      setShowCreateForm(false);
      setMessage({ text: 'The employee has been successfully added.', type: 'success' });
      toast.success('Employee created', {
        description: 'The employee has been successfully added.'
      });
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (employee: Employee) => {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update employee');
      }

      return {
        ...result.data,
        salary: parseFloat(result.data.salary),
      };
    },
    onMutate: async (updatedEmployee) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] });
      const previousEmployees = queryClient.getQueryData(['employees']);

      queryClient.setQueryData(['employees'], (old: Employee[] = []) =>
        old.map((emp) =>
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        )
      );

      return { previousEmployees };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['employees'], context?.previousEmployees);
      toast.error('Failed to update employee', {
        description: error.message || 'An unexpected error occurred'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      toast.success('Employee updated', {
        description: 'The employee has been successfully updated.'
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete employee');
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] });
      const previousEmployees = queryClient.getQueryData(['employees']);

      queryClient.setQueryData(['employees'], (old: Employee[] = []) =>
        old.filter((emp) => emp.id !== id)
      );

      return { previousEmployees };
    },
    onError: (error, id, context) => {
      queryClient.setQueryData(['employees'], context?.previousEmployees);
      toast.error('Failed to delete employee', {
        description: error.message || 'An unexpected error occurred'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted', {
        description: 'The employee has been successfully removed.'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      // Only admin can edit
      if (currentUserRole !== 'admin') {
        toast.error('Access Denied', {
          description: 'Only administrators can edit employees.'
        });
        return;
      }
      updateEmployeeMutation.mutate({
        ...editingEmployee,
        ...formData,
        salary: parseFloat(formData.salary),
      });
    } else {
      // Only admin and super_user can create
      if (currentUserRole !== 'admin' && currentUserRole !== 'super_user') {
        toast.error('Access Denied', {
          description: 'Only administrators and super users can create employees.'
        });
        return;
      }
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleEdit = (employee: Employee) => {
    if (currentUserRole !== 'admin') {
      toast.error('Access Denied', {
        description: 'Only administrators can edit employees.'
      });
      return;
    }

    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      salary: employee.salary.toString(),
      hireDate: employee.hireDate,
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id: string) => {
    if (currentUserRole !== 'admin') {
      toast.error('Access Denied', {
        description: 'Only administrators can delete employees.'
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this employee?')) return;
    deleteEmployeeMutation.mutate(id);
  };

  const isAdmin = currentUserRole === 'admin';
  const isSuperUser = currentUserRole === 'super_user';
  const canCreate = isAdmin || isSuperUser;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin
              ? 'Full access: View, Create, Edit, Delete'
              : isSuperUser
              ? 'View and Create employees'
              : 'View-only access'}
          </p>
        </div>

        {/* Create Button */}
        {canCreate && (
          <div className="mb-6">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingEmployee(null);
                setMessage(null);
                setFormData({
                  name: '',
                  email: '',
                  position: '',
                  department: '',
                  salary: '',
                  hireDate: '',
                });
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ Add Employee'}
            </button>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        {showCreateForm && canCreate && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) =>
                      setFormData({ ...formData, hireDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={
                  createEmployeeMutation.isPending ||
                  updateEmployeeMutation.isPending
                }
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {createEmployeeMutation.isPending ||
                updateEmployeeMutation.isPending
                  ? 'Saving...'
                  : editingEmployee
                  ? 'Update Employee'
                  : 'Add Employee'}
              </button>
            </form>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Employees ({employees?.length || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading employees...</p>
            </div>
          ) : (
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
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hire Date
                    </th>
                    {(canEdit || canDelete) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees?.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {employee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${employee.salary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(employee.hireDate).toLocaleDateString()}
                        </div>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(employee.id)}
                              disabled={deleteEmployeeMutation.isPending}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!employees || employees.length === 0) && !isLoading && (
                <div className="px-6 py-12 text-center text-gray-500">
                  No employees found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Access Notice */}
        {!isAdmin && (
          <div className={`mt-6 border rounded-lg p-4 ${
            isSuperUser
              ? 'bg-purple-50 border-purple-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex">
              <svg
                className={`w-5 h-5 mr-3 flex-shrink-0 ${
                  isSuperUser ? 'text-purple-600' : 'text-blue-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className={`text-sm font-medium ${
                  isSuperUser ? 'text-purple-900' : 'text-blue-900'
                }`}>
                  {isSuperUser ? 'Super User Access' : 'View-Only Access'}
                </h3>
                <p className={`mt-1 text-sm ${
                  isSuperUser ? 'text-purple-700' : 'text-blue-700'
                }`}>
                  {isSuperUser
                    ? 'You can view and create employee records. Edit and delete operations require administrator privileges.'
                    : 'You are viewing this page in read-only mode. Super User or Administrator privileges are required to create, edit, or delete employee records.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
