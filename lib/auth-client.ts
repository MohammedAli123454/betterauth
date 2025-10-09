import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Plugin configuration
  plugins: [adminClient()],

  // Fetch options for better error handling
  fetchOptions: {
    onError(context) {
      // Log errors in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth Client Error]', context.error);
      }
    },
    onSuccess(context) {
      // Optional: Log successful auth actions in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Client Success]', context.response?.status);
      }
    },
  },
});
