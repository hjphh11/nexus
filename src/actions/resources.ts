"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadBlob } from "@/lib/blob";

export async function createResource(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = (formData.get("type") as string) || "OTHER";
  const tagsStr = (formData.get("tags") as string) || "";
  const file = formData.get("file") as File | null;

  if (!title) {
    return { error: "请输入资源名称" };
  }

  const tags = tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileType: string | null = null;

  // Handle file upload via Vercel Blob
  if (file && file.size > 0) {
    fileUrl = await uploadBlob(file, "resources");
    fileName = file.name;
    fileSize = file.size;
    fileType = file.type;
  }

  const resource = await db.resource.create({
    data: {
      title,
      description,
      type,
      tags: JSON.stringify(tags),
      fileUrl,
      fileName,
      fileSize,
      fileType,
      authorId: session.user.id as string,
    },
  });

  revalidatePath("/resources");
  return { success: true, id: resource.id };
}

export async function getResources(params: {
  search?: string;
  type?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const { search, type, sort = "newest", page = 1, limit = 12 } = params;

  const where: Record<string, unknown> = {
    status: "published",
  };

  if (type && type !== "ALL") {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === "popular"
      ? { views: "desc" }
      : sort === "downloads"
        ? { downloads: "desc" }
        : { createdAt: "desc" };

  const [resources, total] = await Promise.all([
    db.resource.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        _count: { select: { comments: true } },
      },
    }),
    db.resource.count({ where: where as never }),
  ]);

  return {
    resources: resources.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]") as string[],
      images: JSON.parse(r.images || "[]") as string[],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getResourceById(id: string) {
  const resource = await db.resource.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { comments: true } },
    },
  });

  if (!resource) return null;

  return {
    ...resource,
    tags: JSON.parse(resource.tags || "[]") as string[],
    images: JSON.parse(resource.images || "[]") as string[],
    metadata: resource.metadata ? JSON.parse(resource.metadata) : null,
  };
}

export async function incrementViews(id: string) {
  await db.resource.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

export async function addComment(resourceId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  if (!content.trim()) {
    return { error: "请输入评论内容" };
  }

  const resource = await db.resource.findUnique({ where: { id: resourceId }, select: { title: true, authorId: true } });
  if (!resource) return { error: "资源不存在" };

  await db.comment.create({
    data: {
      content,
      authorId: session.user.id as string,
      resourceId,
    },
  });

  // Notify resource owner
  if (resource.authorId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: resource.authorId,
        type: "comment",
        title: `有人评论了你的资源`,
        body: content.slice(0, 100),
        link: `/resources/${resourceId}`,
      },
    });
  }

  revalidatePath(`/resources/${resourceId}`);
  return { success: true };
}

export async function deleteResource(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return { error: "资源不存在" };
  if (resource.authorId !== session.user.id) return { error: "无权操作" };

  await db.resource.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/resources");
  return { success: true };
}
