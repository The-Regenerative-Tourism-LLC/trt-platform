"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const SelectRoleSchema = z.object({
  role: z.enum(["operator", "traveler"]),
  name: z.string().min(1).optional(),
});

export async function selectRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsed = SelectRoleSchema.safeParse({
    role: formData.get("role"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    throw new Error("Invalid role selection");
  }

  const { role, name } = parsed.data;
  const userId = session.user.id;

  // Check no role already assigned
  const existingRole = await prisma.userRole.findFirst({ where: { userId } });
  if (existingRole) {
    throw new Error("Role already assigned");
  }

  const displayName =
    name ??
    (await prisma.user.findUnique({ where: { id: userId } }))?.name ??
    "User";

  await prisma.$transaction(async (tx) => {
    await tx.userRole.create({ data: { userId, role } });

    if (role === "operator") {
      await tx.operator.create({
        data: { userId, legalName: displayName },
      });
    } else {
      await tx.traveler.create({
        data: { userId, displayName },
      });
    }
  });
}
