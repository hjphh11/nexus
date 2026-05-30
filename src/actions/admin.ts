"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error("请先登录");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user?.role !== "ADMIN") throw new Error("无权限");
  return userId as string;
}

export async function getAdminStats() {
  await requireAdmin();
  const [users, resources, posts, comments, boards] = await Promise.all([
    db.user.count(),
    db.resource.count(),
    db.post.count(),
    db.comment.count(),
    db.board.count(),
  ]);
  const recentUsers = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCounts = await Promise.all([
    db.user.count({ where: { createdAt: { gte: today } } }),
    db.resource.count({ where: { createdAt: { gte: today } } }),
    db.post.count({ where: { createdAt: { gte: today } } }),
  ]);

  // Real computed stats
  const [totalViews, totalDownloads, allResources] = await Promise.all([
    db.resource.aggregate({ _sum: { views: true } }).then((r) => r._sum.views || 0),
    db.resource.aggregate({ _sum: { downloads: true } }).then((r) => r._sum.downloads || 0),
    db.resource.findMany({ select: { fileSize: true } }),
  ]);
  const totalStorage = allResources.reduce((s, r) => s + (r.fileSize || 0), 0);
  const totalPostViews = (await db.post.aggregate({ _sum: { views: true } }))._sum.views || 0;
  const allViews = totalViews + totalPostViews;

  return {
    stats: { users, resources, posts, comments, boards },
    today: { users: todayCounts[0], resources: todayCounts[1], posts: todayCounts[2] },
    recentUsers,
    totalDownloads,
    totalStorage,
    totalViews: allViews,
  };
}

export async function getAdminUsers(search?: string) {
  await requireAdmin();
  const where = search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {};
  return db.user.findMany({ where: where as any, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { resources: true, posts: true } } } });
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAdminResources(search?: string, type?: string) {
  await requireAdmin();
  const where: any = {};
  if (search) where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
  if (type && type !== "ALL") where.type = type;
  return db.resource.findMany({
    where, orderBy: { createdAt: "desc" }, take: 50,
    include: { author: { select: { name: true } } },
  });
}

export async function adminDeleteResource(id: string) {
  await requireAdmin();
  await db.resource.delete({ where: { id } });
  revalidatePath("/admin/resources");
  return { success: true };
}

export async function getAdminBoards() {
  await requireAdmin();
  return db.board.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { posts: true } } } });
}

export async function adminCreateBoard(name: string, slug: string, description: string) {
  await requireAdmin();
  await db.board.create({ data: { name, slug, description } });
  revalidatePath("/admin/forum");
  return { success: true };
}

export async function adminDeleteBoard(id: string) {
  await requireAdmin();
  await db.board.delete({ where: { id } });
  revalidatePath("/admin/forum");
  return { success: true };
}

export async function getAdminPosts(search?: string) {
  await requireAdmin();
  const where = search ? { OR: [{ title: { contains: search } }, { content: { contains: search } }] } : {};
  return db.post.findMany({
    where: where as any, orderBy: { createdAt: "desc" }, take: 50,
    include: { author: { select: { name: true } }, board: { select: { name: true } } },
  });
}

export async function adminDeletePost(id: string) {
  await requireAdmin();
  await db.post.delete({ where: { id } });
  revalidatePath("/admin/forum");
  return { success: true };
}
