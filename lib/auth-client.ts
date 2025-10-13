import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Plugin configuration
  plugins: [adminClient()],

  // Fetch options for better error handling
  fetchOptions: {
    onError(context) {
      if (process.env.NODE_ENV === 'development') {
        const status =
          context.error?.status ??
          context.error?.statusCode ??
          context.response?.status ??
          context.response?.statusCode;
        const isClientError = status ? status >= 400 && status < 500 : false;
        const log = isClientError ? console.warn : console.error;
        const label = isClientError ? 'Warning' : 'Error';

        log(`[Auth Client ${label} - Context]`, JSON.stringify(context, null, 2));
        log(`[Auth Client ${label} - Error]`, JSON.stringify(context.error, null, 2));
        log(`[Auth Client ${label} - Details]`, {
          status,
          statusText: context.error?.statusText ?? context.response?.statusText,
          message: context.error?.message,
          code: context.error?.code,
        });
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
