'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { checkIsFirstUser } from '@/app/actions/check-first-user';
import { createFirstAdmin } from '@/app/actions/create-first-admin';
import { BarLoader } from 'react-spinners';

const setupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    bootstrapToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const [message, setMessage] = useState('');
  const [requiresToken, setRequiresToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  // Check if bootstrap token is required
  useEffect(() => {
    let active = true;

    const checkTokenRequirement = async () => {
      try {
        const result = await checkIsFirstUser();
        if (active) {
          setRequiresToken(result.requiresToken);
        }
      } catch (error) {
        console.error('Error checking token requirement:', error);
      }
    };

    void checkTokenRequirement();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: SetupFormData) => {
    setMessage('');

    try {
      const result = await createFirstAdmin({
        email: data.email,
        password: data.password,
        name: data.name,
        bootstrapToken: requiresToken ? data.bootstrapToken : undefined,
      });

      if (!result.success) {
        setMessage(result.error || 'Setup failed');
        return;
      }

      // Sign in after creating admin
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      // Clear cache and redirect
      queryClient.clear();
      router.replace('/admin');
    } catch (error) {
      console.error('Setup error:', error);
      setMessage('Setup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
      <div className="w-full max-w-[440px] p-8 bg-white rounded-xl shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Create First Admin</h1>
        <p className="mb-6 text-sm text-gray-600">Set up your admin account to get started</p>

        {message && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={`transition-opacity ${isSubmitting ? 'opacity-80' : 'opacity-100'}`}>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Name"
              {...register('name')}
              className={`w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {requiresToken && (
            <div className="mb-3">
              <input
                type="text"
                placeholder="Bootstrap Token"
                {...register('bootstrapToken')}
                className={`w-full px-3 py-2.5 border rounded-md text-sm outline-none transition-colors font-mono ${
                  errors.bootstrapToken ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                }`}
              />
              <p className="mt-1 text-xs text-gray-600">Enter the bootstrap token from your .env.local file</p>
              {errors.bootstrapToken && <p className="mt-1 text-xs text-red-600">{errors.bootstrapToken.message}</p>}
            </div>
          )}

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
                autoComplete="new-password"
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

          <div className="mb-3">
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                {...register('confirmPassword')}
                className={`w-full px-3 py-2.5 pr-10 border rounded-md text-sm outline-none transition-colors ${
                  errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 mt-1 bg-blue-600 text-white rounded-md text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Admin Account'}
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
