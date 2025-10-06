'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
};

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const session = await authClient.getSession();
      if (!session?.data) {
        router.push('/login');
        return;
      }

      const user = session.data.user;
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(user);

      // Fetch users
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setUsers(users.filter((u) => u.id !== userId));
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to delete user');
    }
  };

  if (loading)
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>Loading…</div>
    );
  if (!currentUser) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1>Admin Panel</h1>
          <p>Welcome, Admin {currentUser.name}!</p>
        </div>
        <Link
          href="/dashboard"
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Link
          href="/admin/create-user"
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          + Create New User
        </Link>
      </div>

      <h2>All Users ({users.length})</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '2px solid #ccc',
              backgroundColor: '#f5f5f5',
            }}
          >
            <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Verified</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{u.email}</td>
              <td style={{ padding: '12px' }}>{u.name}</td>
              <td style={{ padding: '12px' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor:
                      u.role === 'admin' ? '#ff4444' : '#4444ff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {u.role}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{u.emailVerified ? '✓' : '✗'}</td>
              <td style={{ padding: '12px' }}>
                <Link
                  href={`/admin/users/${u.id}`}
                  style={{ marginRight: '10px', color: 'blue' }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(u.id)}
                  style={{
                    color: 'red',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  disabled={u.id === currentUser.id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
