import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // In a real application, you would check Supabase Auth cookies here.
  // For now, this is a placeholder to show where the auth guard goes.
  // When fully implemented, it will redirect unauthenticated users to /login.
  
  // const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session && request.nextUrl.pathname.startsWith('/(dashboard)')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|auth).*)',
  ],
};

