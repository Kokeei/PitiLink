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
  // /api/setup gere sa propre protection (SETUP_TOKEN) : provisionnement
  // initial d'une base vide, avant qu'aucun compte n'existe encore.
  const isApiSetup = nextUrl.pathname.startsWith("/api/setup");

  if (isApiAuth || isApiSetup) return NextResponse.next();

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

  // /compte est un espace transversal (changer son mot de passe...),
  // accessible à tout utilisateur connecté quel que soit son rôle.
  const isCompte = nextUrl.pathname.startsWith("/compte");

  if (!isCompte && !nextUrl.pathname.startsWith(espace)) {
    return NextResponse.redirect(new URL(espace, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
