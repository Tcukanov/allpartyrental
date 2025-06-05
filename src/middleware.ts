import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Reserved paths that should not be used as dynamic route parameters
const RESERVED_PATHS = [
  'api',
  'client',
  'provider',
  'admin',
  '_next',
  'next',
  'static',
  'auth',
  'socket',
  'public',
  'images',
  'assets',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token to check user role
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Handle role-based redirects for authenticated users
  if (token) {
    // If provider is trying to access root or non-provider pages, redirect to dashboard
    if (token.role === 'PROVIDER') {
      // Allow access to provider routes
      if (pathname.startsWith('/provider/')) {
        return NextResponse.next();
      }
      
      // Allow access to API routes, auth routes, and other system routes
      if (pathname.startsWith('/api/') || 
          pathname.startsWith('/auth/') || 
          pathname.startsWith('/_next/')) {
        return NextResponse.next();
      }
      
      // Redirect providers from root or other pages to their dashboard
      if (pathname === '/' || 
          (!pathname.startsWith('/provider/') && 
           !pathname.startsWith('/api/') && 
           !pathname.startsWith('/auth/') && 
           !pathname.startsWith('/_next/'))) {
        return NextResponse.redirect(new URL('/provider/dashboard', request.url));
      }
    }
  }
  
  // Skip all application routes that start with reserved prefixes
  // These are legitimate application routes, not dynamic routes
  if (RESERVED_PATHS.some(prefix => pathname.startsWith(`/${prefix}/`))) {
    return NextResponse.next();
  }

  // Skip API routes and other system routes entirely
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname.startsWith('/socket/') ||
      pathname.startsWith('/public/')) {
    return NextResponse.next();
  }

  // Dynamic route pattern is /:location/:service (only check if not already handled)
  const segments = pathname.split('/').filter(Boolean);
  
  // Only check paths with exactly 2 segments that might be dynamic routes
  if (segments.length === 2) {
    const [location, service] = segments;

    // Now we only need to check non-routed paths for reserved words
    // This check has been simplified and will rarely trigger since we exclude paths above
    if (RESERVED_PATHS.includes(location) || RESERVED_PATHS.includes(service)) {
      console.log(`Potential conflict with reserved path: ${pathname}`);
      // Just log a warning but let it pass through
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on all paths except specific ones
export const config = {
  matcher: [
    // Match all paths except special system paths that should be excluded
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 