import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function proxy(req: NextRequest & { nextauth?: { token?: any } }) {
    // Explicitly allow NextAuth routes to pass through
    if (req.nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow NextAuth API routes to pass through without authentication
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/api/v1/tasks/:path*",
    "/api/v1/tags/:path*",
    "/api/v1/reminder-rules/:path*",
  ],
};
