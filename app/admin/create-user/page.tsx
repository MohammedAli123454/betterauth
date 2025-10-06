'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUserPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('User created successfully!');
      setTimeout(() => router.push('/admin'), 1500);
    } else {
      setMessage(data.error || 'Failed to create user');
    }

    setLoading(false);
  };

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

      <h1>Create New User</h1>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: message.includes('success')
              ? '#d4edda'
              : '#f8d7da',
            border: `1px solid ${
              message.includes('success') ? '#c3e6cb' : '#f5c6cb'
            }`,
            borderRadius: '4px',
            color: message.includes('success') ? '#155724' : '#721c24',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <small style={{ color: '#666' }}>Minimum 8 characters</small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create User'}
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
        </div>
      </form>
    </div>
  );
}
