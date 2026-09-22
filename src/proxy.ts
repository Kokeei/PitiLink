import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { Role } from "@/generated/prisma/enums";
import { DELEGATION_COOKIE } from "@/lib/delegation-constants";

const { auth } = NextAuth(authConfig);

const ESPACE_PAR_ROLE: Record<Role, string> = {
  PARENT: "/parent",
  PROFESSIONNEL: "/pro",
  RESPONSABLE: "/direction",
  DIRECTION: "/direction",
  ADMIN_PLATEFORME: "/admin",
};

const ESPACES_DELEGATION = ["/parent", "/pro", "/direction", "/compte", "/admin"];
const PUBLIC_PATHS = ["/connexion"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
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
  const delegationActive = user.role === "ADMIN_PLATEFORME" &&
    Boolean(req.cookies.get(DELEGATION_COOKIE)?.value);

  if (isPublic || nextUrl.pathname === "/") {
    if (delegationActive) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(espace, nextUrl.origin));
  }

  const isCompte = nextUrl.pathname.startsWith("/compte");

  // Pendant une délégation, les layouts serveur vérifient la délégation en base
  // et calculent l'utilisateur effectif. Le proxy reste volontairement Edge-safe.
  if (delegationActive && ESPACES_DELEGATION.some((p) => nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!isCompte && !nextUrl.pathname.startsWith(espace)) {
    return NextResponse.redirect(new URL(espace, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
