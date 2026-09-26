// Next.js 16 — "proxy" replaces "middleware"
// This runs at the edge and must NOT import Prisma or Node.js-only modules.
// Auth check is done via the JWT cookie directly using next-auth's helper.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export const proxy = auth(function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // auth() attaches session to req — cast to access it
  const session = (req as unknown as { auth: { user?: unknown } | null }).auth;

  // Unauthenticated → redirect to login
  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated → don't show auth pages
  if (session?.user && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico)$).*)",
  ],
};
