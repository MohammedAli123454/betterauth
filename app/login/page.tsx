'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { checkIsFirstUser } from '@/app/actions/check-first-user';
import { createFirstAdmin } from '@/app/actions/create-first-admin';

type UserRole = 'admin' | 'super_user' | 'user' | string;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [requiresToken, setRequiresToken] = useState(false);
  const [isCheckingFirstUser, setIsCheckingFirstUser] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const checkFirstUser = async () => {
      try {
        // Use server action with NO caching - always fresh check
        const result = await checkIsFirstUser();
        if (active) {
          setIsFirstUser(result.isEmpty);
          setRequiresToken(result.requiresToken);
        }
      } catch (error) {
        console.error('Error checking first user:', error);
        if (active) {
          setIsFirstUser(false);
          setRequiresToken(false);
        }
      } finally {
        if (active) {
          setIsCheckingFirstUser(false);
        }
      }
    };

    void checkFirstUser();

    return () => {
      active = false;
    };
  }, []);

  const redirectToRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/admin');
        return;
      case 'super_user':
        router.replace('/employees');
        return;
      default:
        router.replace('/employees');
    }
  };

  const resolveSessionAndRedirect = async () => {
    // CRITICAL: Clear all cached data on login to prevent stale session data
    queryClient.clear();

    // Fetch fresh session
    const sessionResult = await authClient.getSession();
    const sessionUser = sessionResult.data?.user;

    if (!sessionUser) {
      setMessage('Unable to determine user session after authentication.');
      setIsSubmitting(false);
      return;
    }

    redirectToRole(sessionUser.role as UserRole);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        setMessage(data?.error || 'Sign in failed');
        setIsSubmitting(false);
        return;
      }

      await resolveSessionAndRedirect();
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
      // Use server action to create first admin with Better Auth
      const result = await createFirstAdmin({
        email,
        password,
        name,
        bootstrapToken: requiresToken ? bootstrapToken : undefined,
      });

      if (!result.success) {
        setMessage(result.error || 'Sign up failed');
        setIsSubmitting(false);
        return;
      }

      // Now sign in with Better Auth to get session
      await authClient.signIn.email({
        email,
        password,
      });

      await resolveSessionAndRedirect();
    } catch (error) {
      console.error('Sign up error:', error);
      setMessage('Sign up failed');
      setIsSubmitting(false);
    }
  };

  const formHeading = useMemo(
    () => (isFirstUser ? 'Create First Admin' : 'Welcome Back'),
    [isFirstUser]
  );

  const formSubheading = useMemo(
    () =>
      isFirstUser
        ? 'Create the first admin account'
        : 'Sign in with your credentials',
    [isFirstUser]
  );

  // Don't render the form until we know if this is first user or not
  if (isCheckingFirstUser) {
    return (
      <div
        style={{
          maxWidth: '400px',
          margin: '100px auto',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '14px', color: '#888' }}>
          Checking for existing administrator…
        </p>
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
      <h1 style={{ marginBottom: '10px' }}>{formHeading}</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>{formSubheading}</p>

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

      <form
        onSubmit={isFirstUser ? handleSignUp : handleSignIn}
        style={{ opacity: isSubmitting ? 0.8 : 1, transition: 'opacity 0.2s' }}
      >
        {isFirstUser && (
          <>
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
            {requiresToken && (
              <>
                <input
                  type="text"
                  placeholder="Bootstrap Token"
                  value={bootstrapToken}
                  onChange={(e) => setBootstrapToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                  required
                />
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '-8px',
                  marginBottom: '10px',
                }}>
                  Enter the bootstrap token from your .env.local file
                </p>
              </>
            )}
          </>
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
              : 'Signing in...'
            : isFirstUser
            ? 'Create Admin Account'
            : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
