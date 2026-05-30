"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "请输入用户名" };

  await db.user.update({
    where: { id: session.user.id as string },
    data: { name },
  });

  revalidatePath("/settings");
  return { success: true, message: "资料已更新" };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const currentPw = formData.get("currentPassword") as string;
  const newPw = formData.get("newPassword") as string;
  const confirmPw = formData.get("confirmPassword") as string;

  if (!currentPw || !newPw || !confirmPw) {
    return { error: "请填写所有密码字段" };
  }
  if (newPw !== confirmPw) {
    return { error: "两次新密码不一致" };
  }
  if (newPw.length < 6) {
    return { error: "新密码至少 6 位" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
  });

  if (!user?.hashedPassword) {
    return { error: "当前账户未设置密码" };
  }

  const valid = await bcrypt.compare(currentPw, user.hashedPassword);
  if (!valid) return { error: "当前密码不正确" };

  const hashedPassword = await bcrypt.hash(newPw, 12);
  await db.user.update({
    where: { id: session.user.id as string },
    data: { hashedPassword },
  });

  return { success: true, message: "密码已修改" };
}

export async function getNotifySettings() {
  const session = await auth();
  if (!session?.user?.id) return {};
  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    select: { notifySettings: true },
  });
  try {
    return JSON.parse(user?.notifySettings || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export async function updateNotifySetting(key: string, value: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    select: { notifySettings: true },
  });

  const settings = JSON.parse(user?.notifySettings || "{}");
  settings[key] = value;

  await db.user.update({
    where: { id: session.user.id as string },
    data: { notifySettings: JSON.stringify(settings) },
  });

  return { success: true };
}
