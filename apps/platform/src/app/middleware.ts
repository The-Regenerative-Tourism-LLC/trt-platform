import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

const PROTECTED_OPERATOR = ["/operator/", "/(operator)/"];
const PROTECTED_ADMIN = ["/admin/", "/(admin)/"];
const PROTECTED_TRAVELER = ["/traveler/", "/(traveler)/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isOperatorRoute = PROTECTED_OPERATOR.some((p) => pathname.startsWith(p));
  const isAdminRoute = PROTECTED_ADMIN.some((p) => pathname.startsWith(p));
  const isTravelerRoute = PROTECTED_TRAVELER.some((p) => pathname.startsWith(p));

  if (!isOperatorRoute && !isAdminRoute && !isTravelerRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get("trt_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isAdminRoute && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isOperatorRoute && session.role !== "operator" && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/(operator)/:path*",
    "/(admin)/:path*",
    "/(traveler)/:path*",
    "/operator/:path*",
    "/admin/:path*",
    "/traveler/:path*",
  ],
};
