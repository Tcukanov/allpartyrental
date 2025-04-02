import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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