import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

// Configuration "edge-safe" : ne doit rien importer qui depende de Node (Prisma/pg),
// afin de pouvoir etre utilisee par le middleware qui tourne sur le runtime Edge.
export default {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.garderieId = user.garderieId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.garderieId = token.garderieId as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
