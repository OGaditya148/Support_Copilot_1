import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function applyRateLimit(ip: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    record = { count: 0, expiresAt: now + windowMs };
  }
  record.count++;
  rateLimitMap.set(ip, record);
  return record.count <= maxRequests;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  if (pathname.startsWith("/login") || pathname.startsWith("/reset")) {
    const isAllowed = applyRateLimit(ip, 5, 15 * 60 * 1000);
    if (!isAllowed) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  let response = NextResponse.next();
  const session = await auth();
  
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if ((session.user as any).role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  }

  if (pathname.startsWith("/tickets")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
  }

  // Security Headers (CSP, HSTS, CSRF)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
