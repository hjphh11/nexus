import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth(async (req) => {
  const pathname = req.nextUrl.pathname;

  // Protect /admin routes — ADMIN only
  if (pathname.startsWith("/admin")) {
    const role = (req.auth?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/upload/:path*", "/settings/:path*"],
};
