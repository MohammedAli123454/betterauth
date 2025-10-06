'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [emailVerified, setEmailVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const foundUser = data.users.find((u: User) => u.id === params.id);
        if (foundUser) {
          setUser(foundUser);
          setName(foundUser.name);
          setRole(foundUser.role);
          setEmailVerified(foundUser.emailVerified);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, emailVerified }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('User updated successfully!');
      setTimeout(() => router.push('/admin'), 1500);
    } else {
      setMessage(data.error || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const response = await fetch(`/api/admin/users/${params.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.push('/admin');
    } else {
      const data = await response.json();
      setMessage(data.error || 'Failed to delete user');
    }
  };

  if (loading)
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>Loading…</div>
    );
  if (!user) return <div style={{ padding: '20px' }}>User not found</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/admin"
          style={{
            color: '#0070f3',
            textDecoration: 'none',
          }}
        >
          ← Back to Admin Panel
        </Link>
      </div>

      <h1>Edit User</h1>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: message.includes('success')
              ? '#d4edda'
              : '#f8d7da',
            borderRadius: '4px',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={emailVerified}
              onChange={(e) => setEmailVerified(e.target.checked)}
            />
            Email Verified
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Update User
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginLeft: 'auto',
              cursor: 'pointer',
            }}
          >
            Delete User
          </button>
        </div>
      </form>
    </div>
  );
}
