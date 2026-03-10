import type { AppRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      roles: AppRole[];
      needsRoleSelection: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: AppRole[];
    needsRoleSelection?: boolean;
  }
}
