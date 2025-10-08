'use client';

import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch('/api/check-first-user');
        const data = await response.json();
        setIsFirstUser(data.isEmpty);
      } catch (error) {
        console.error('Error checking first user:', error);
        setIsFirstUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstUser();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      // Direct fetch to get proper error messages from Arcjet
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit (429) and other errors
        setMessage(data.error || 'Sign in failed');
        setIsSubmitting(false);
        return;
      }

      if (data.error) {
        setMessage(data.error || 'Sign in failed');
        setIsSubmitting(false);
      } else {
        // Wait a moment for session to be written to database
        setMessage('Sign in successful! Redirecting...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use window.location for a full page reload to ensure middleware gets fresh session
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage('Sign in failed');
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signup-first-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setMessage(data.error || 'Sign up failed');
        setIsSubmitting(false);
      } else {
        setMessage('Admin account created! Redirecting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setMessage('Sign up failed');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: '400px',
          margin: '100px auto',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '100px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
    >
      <h1 style={{ marginBottom: '10px' }}>
        {isFirstUser ? 'Create First Admin' : 'Welcome Back'}
      </h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {isFirstUser
          ? 'Create the first admin account'
          : 'Sign in with your credentials'}
      </p>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: message.includes('created')
              ? '#d4edda'
              : '#f8d7da',
            border: `1px solid ${
              message.includes('created') ? '#c3e6cb' : '#f5c6cb'
            }`,
            borderRadius: '4px',
            color: message.includes('created') ? '#155724' : '#721c24',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={isFirstUser ? handleSignUp : handleSignIn}>
        {isFirstUser && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
          autoComplete={isFirstUser ? 'new-password' : 'current-password'}
          required
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isSubmitting ? '#999' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.2s ease-in-out',
          }}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isFirstUser
              ? 'Creating...'
              : 'Signing in…'
            : isFirstUser
            ? 'Create Admin Account'
            : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
