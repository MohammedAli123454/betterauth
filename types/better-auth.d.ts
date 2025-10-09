import 'better-auth';

declare module 'better-auth' {
  interface User {
    role: string;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
      name: string;
      role: string;
      emailVerified: boolean;
      image?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
