'use client';

import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      if (result.error) {
        setMessage(result.error.message || 'Sign in failed');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setMessage('Sign in failed');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: email.split('@')[0],
      });
      if (result.error) {
        setMessage(result.error.message || 'Sign up failed');
      } else {
        setMessage('Account created! Signing you in...');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (error) {
      setMessage('Sign up failed');
    }
  };

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
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
      </p>

      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '10px',
            backgroundColor: message.includes('success') || message.includes('created')
              ? '#d4edda'
              : '#f8d7da',
            border: `1px solid ${
              message.includes('success') || message.includes('created')
                ? '#c3e6cb'
                : '#f5c6cb'
            }`,
            borderRadius: '4px',
            color: message.includes('success') || message.includes('created')
              ? '#155724'
              : '#721c24',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
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
          required
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '10px',
          }}
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: 'transparent',
          color: '#0070f3',
          border: '1px solid #0070f3',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {isSignUp
          ? 'Already have an account? Sign In'
          : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}
