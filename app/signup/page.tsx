'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '10px' }}>Create Account</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Sign up to get started
      </p>
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Name:
          </label>
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
            required
          />
        </div>
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
            minLength={8}
          />
          <small style={{ color: '#666' }}>
            Must be at least 8 characters
          </small>
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
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
        Already have an account?{' '}
        <Link
          href="/signin"
          style={{ color: '#0070f3', textDecoration: 'none' }}
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
