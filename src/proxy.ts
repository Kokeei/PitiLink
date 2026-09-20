import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { Role } from "@/generated/prisma/enums";

const { auth } = NextAuth(authConfig);

const ESPACE_PAR_ROLE: Record<Role, string> = {
  PARENT: "/parent",
  PROFESSIONNEL: "/pro",
  RESPONSABLE: "/direction",
  DIRECTION: "/direction",
  ADMIN_PLATEFORME: "/admin",
};

const PUBLIC_PATHS = ["/connexion"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();

  const user = req.auth?.user;

  if (!user) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/connexion", nextUrl.origin);
    url.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const espace = ESPACE_PAR_ROLE[user.role];

  if (isPublic || nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(espace, nextUrl.origin));
  }

  if (!nextUrl.pathname.startsWith(espace)) {
    return NextResponse.redirect(new URL(espace, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
