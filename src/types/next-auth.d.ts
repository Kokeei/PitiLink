import { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    garderieId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      garderieId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    garderieId: string | null;
  }
}
