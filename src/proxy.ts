import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const protectedRoutes = [
  "/dashboard",
  "/checklists",
  "/equipamentos",
  "/inspecoes",
  "/nao-conformidades",
  "/relatorios",
  "/equipe",
  "/configuracoes",
  "/perfil"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/") && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.svg|brand).*)"]
};

