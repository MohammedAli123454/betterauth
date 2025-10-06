'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authClient.signIn.email({
        email,
        password,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '10px' }}>Welcome Back</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Sign in to your account
      </p>
      <form onSubmit={handleSignIn}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            required
          />
        </div>
        {error && (
          <p
            style={{
              color: 'red',
              backgroundColor: '#fee',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
            }}
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontSize: '16px',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        Don't have an account?{' '}
        <Link
          href="/signup"
          style={{ color: '#0070f3', textDecoration: 'none' }}
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
