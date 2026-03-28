"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { AppRole } from "@prisma/client";

export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  roles: AppRole[];
  /** Primary role — first in the roles array. Null until role is selected. */
  role: AppRole | null;
  needsRoleSelection: boolean;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        roles: session.user.roles ?? [],
        role: session.user.roles?.[0] ?? null,
        needsRoleSelection: session.user.needsRoleSelection ?? false,
      }
    : null;

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: "/login" });
  };

  return {
    user,
    loading: status === "loading",
    signOut,
  };
}
