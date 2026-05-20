// Phase 2 will gate /library/* on cookie presence. For Phase 1 the middleware is a no-op
// (matcher is set so it loads, but it just passes the request through).
import { NextResponse, type NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*"],
};
