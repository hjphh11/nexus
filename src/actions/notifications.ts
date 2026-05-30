"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.notification.findMany({
    where: { userId: session.user.id as string },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return db.notification.count({
    where: {
      userId: session.user.id as string,
      isRead: false,
    },
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });
  revalidatePath("/");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.updateMany({
    where: { userId: session.user.id as string, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/");
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  // Don't notify yourself
  const session = await auth();
  if (session?.user?.id === data.userId) return;

  await db.notification.create({ data });
}
