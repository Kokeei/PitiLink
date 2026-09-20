import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";

// Anti brute-force : verrouillage temporaire du compte après plusieurs
// échecs de connexion consécutifs (stocké en base pour survivre entre
// invocations serverless, pas de mémoire partagée entre elles).
const SEUIL_VERROUILLAGE = 5;
const DUREE_VERROUILLAGE_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        if (user.verrouJusqua && user.verrouJusqua > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const tentatives = user.tentativesEchoueesConnexion + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tentativesEchoueesConnexion: tentatives,
              verrouJusqua: tentatives >= SEUIL_VERROUILLAGE ? new Date(Date.now() + DUREE_VERROUILLAGE_MS) : null,
            },
          });
          return null;
        }

        if (user.tentativesEchoueesConnexion > 0 || user.verrouJusqua) {
          await prisma.user.update({
            where: { id: user.id },
            data: { tentativesEchoueesConnexion: 0, verrouJusqua: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          garderieId: user.garderieId,
        };
      },
    }),
  ],
});
