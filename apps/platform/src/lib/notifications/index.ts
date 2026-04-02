/**
 * Notification system.
 *
 * In-app notifications for travelers (stored in DB, displayed in UI).
 * For operators/admins, email is the primary notification channel.
 *
 * This module wraps Prisma writes so notification creation is always
 * consistent and never leaks raw Prisma calls into domain logic.
 */

import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";

interface CreateTravelerNotificationInput {
  travelerId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export async function createTravelerNotification(
  input: CreateTravelerNotificationInput
): Promise<void> {
  await prisma.notification.create({
    data: {
      travelerId: input.travelerId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(travelerId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { travelerId, isRead: false },
    data: { isRead: true },
  });
}

export async function getUnreadCount(travelerId: string): Promise<number> {
  return prisma.notification.count({
    where: { travelerId, isRead: false },
  });
}

export async function getTravelerNotifications(
  travelerId: string,
  limit = 30
) {
  return prisma.notification.findMany({
    where: { travelerId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
