import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  INVITE_CODE_COOKIE,
  INVITE_CODE_MAX_AGE_SECONDS,
} from "@/lib/invite-code";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Link de convite (/?tk=CODIGO): guarda o código em cookie e limpa a URL.
  // A validação acontece em /invitations, ao clicar em "Confirmar presença".
  if (pathname === "/") {
    const inviteCode = searchParams.get("tk")?.trim().toUpperCase();
    if (!inviteCode) return NextResponse.next();

    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("tk");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(INVITE_CODE_COOKIE, inviteCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: INVITE_CODE_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  }

  const sessionCookie = getSessionCookie(request);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
