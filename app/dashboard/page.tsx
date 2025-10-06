'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const session = await authClient.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    getSession();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  if (loading)
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>Loading…</div>
    );
  if (!user) return null;

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Dashboard</h1>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <p>
          <strong>Name:</strong> {user.name || 'Not set'}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong>{' '}
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: user.role === 'admin' ? '#ff4444' : '#4444ff',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {user.role}
          </span>
        </p>
        <p>
          <strong>Email Verified:</strong> {user.emailVerified ? '✓ Yes' : '✗ No'}
        </p>
      </div>

      {user.role === 'admin' && (
        <Link
          href="/admin"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            marginBottom: '10px',
          }}
        >
          Admin Panel
        </Link>
      )}

      <button
        onClick={handleSignOut}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
