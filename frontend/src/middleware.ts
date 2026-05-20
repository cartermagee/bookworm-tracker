import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasAuthCookie = request.cookies.has("auth");
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*"],
};
