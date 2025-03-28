import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the pathname starts with "/api"
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // For API requests to service-requests endpoint, add some logging
    if (request.nextUrl.pathname.startsWith('/api/provider/service-requests')) {
      console.log('Request URL:', request.nextUrl.toString());
      console.log('Request method:', request.method);
    }
    
    // Let the API request continue normally
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    
    // Match city/service routes but explicitly exclude paths starting with 'api'
    '/((?!api).*)/:service'
  ],
}; 