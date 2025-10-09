import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Define route permissions
const routePermissions: Record<string, string[]> = {
  '/admin': ['admin'],
  '/employees': ['admin', 'super_user', 'user'],
};

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/unauthorized'];

// API routes that should not be checked by middleware
const apiRoutes = ['/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes (they have their own auth)
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get session from Better Auth
  let session;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    // On database errors (like Neon connection issues), let the request through
    // The page-level auth will handle it
    console.error('[Middleware] Session check failed:', error);
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based permissions
  const requiredRoles = routePermissions[pathname];

  if (requiredRoles) {
    const userRole = session.user.role as string;

    if (!requiredRoles.includes(userRole)) {
      // Redirect to unauthorized page with original path
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      unauthorizedUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
