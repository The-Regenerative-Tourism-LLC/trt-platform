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
      /**
       * true  → email confirmed (or OAuth user — Google verifies automatically)
       * false → credentials user who has not yet clicked the verification link
       *
       * Uses a distinct name to avoid collision with NextAuth's built-in
       * emailVerified: Date | null field on the User model.
       * Defaults to true for existing JWTs that pre-date this field.
       */
      isEmailVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: AppRole[];
    needsRoleSelection?: boolean;
    isEmailVerified?: boolean;
  }
}
