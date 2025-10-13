'use client';

import { createContext, useContext } from 'react';

type CurrentUser = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  image?: string | null;
};

const CurrentUserContext = createContext<CurrentUser | undefined>(undefined);

// Add display name for better debugging
CurrentUserContext.displayName = 'CurrentUserContext';

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * Hook to access the current user from context.
 * @throws {Error} If used outside of CurrentUserProvider
 */
export function useCurrentUser(): CurrentUser {
  const context = useContext(CurrentUserContext);

  if (context === undefined) {
    throw new Error(
      'useCurrentUser must be used within a CurrentUserProvider'
    );
  }

  return context;
}
