"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("login") as string); // form uses name="login"
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "请填写所有字段" };
  }

  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  if (password !== confirmPassword) {
    return { error: "两次密码不一致" };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已注册" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { name, email, hashedPassword },
  });

  return { success: true };
}
