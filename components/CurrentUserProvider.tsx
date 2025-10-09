'use client';

import { createContext, useContext } from 'react';

type CurrentUser = {
  id: string;
  email: string;
  role: string;
  name: string | null;
  image?: string | null;
};

const CurrentUserContext = createContext<CurrentUser | null>(null);

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

export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}
