'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { checkIsFirstUser } from '@/app/actions/check-first-user';
import { BarLoader } from 'react-spinners';

type UserRole = 'admin' | 'super_user' | 'user' | string;

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Check if this is first user, redirect to setup if so
  useEffect(() => {
    let active = true;

    const checkFirstUser = async () => {
      try {
        const result = await checkIsFirstUser();
        if (active && result.isEmpty) {
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error checking first user:', error);
      }
    };

    void checkFirstUser();

    return () => {
      active = false;
    };
  }, [router]);

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

  const onSubmit = async (data: LoginFormData) => {
    setMessage('');

    try {
      // Use Better Auth client method directly
      const { data: session, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Handle specific error messages
        let errorMessage = error.message || 'Sign in failed';

        // Better Auth sometimes returns technical errors, make them user-friendly
        const normalized = errorMessage.toLowerCase();

        if (normalized.includes('invalid password hash') ||
            normalized.includes('invalid') ||
            normalized.includes('password') ||
            normalized.includes('credentials')) {
          errorMessage = 'Invalid email or password';
        }

        setMessage(errorMessage);
        return;
      }

      // Clear cache and get user role from session
      queryClient.clear();
      const sessionUser = session?.user;

      if (!sessionUser) {
        setMessage('Unable to determine user session after authentication.');
        return;
      }

      // Type assertion for role property (added via Better Auth additionalFields)
      redirectToRole((sessionUser as any).role as UserRole);
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
      <div className="w-full max-w-[440px] p-8 bg-white rounded-xl shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Welcome Back</h1>
        <p className="mb-6 text-sm text-gray-600">Sign in to your account</p>

        {message && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={`transition-opacity ${isSubmitting ? 'opacity-80' : 'opacity-100'}`}>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email"
              {...register('email')}
              className={`w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors ${
                errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
              }`}
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="mb-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                {...register('password')}
                className={`w-full px-3 py-2.5 pr-10 border rounded-md text-sm outline-none transition-colors ${
                  errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 mt-1 bg-blue-600 text-white rounded-md text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          {isSubmitting && (
            <div className="mt-4">
              <BarLoader color="#0070f3" width="100%" />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
