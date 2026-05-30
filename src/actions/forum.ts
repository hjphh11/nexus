"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// ═══ BOARDS ═══

export async function getBoards() {
  const boards = await db.board.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return boards;
}

export async function getBoardBySlug(slug: string) {
  return db.board.findUnique({ where: { slug } });
}

// ═══ POSTS ═══

export async function getPosts(boardSlug: string, params: {
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const { sort = "newest", page = 1, limit = 15 } = params;

  const board = await db.board.findUnique({ where: { slug: boardSlug } });
  if (!board) return null;

  const orderBy =
    sort === "popular"
      ? [{ pinned: "desc" as const }, { upvotes: "desc" as const }]
      : [{ pinned: "desc" as const }, { createdAt: "desc" as const }];

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: { boardId: board.id },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true, upvoters: true } },
      },
    }),
    db.post.count({ where: { boardId: board.id } }),
  ]);

  return {
    board,
    posts: posts.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags || "[]") as string[],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPostById(postId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      board: { select: { id: true, name: true, slug: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
      _count: { select: { comments: true, upvoters: true } },
    },
  });

  if (!post) return null;

  // Check if current user has upvoted
  let hasUpvoted = false;
  if (userId) {
    const uv = await db.postUpvote.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    hasUpvoted = !!uv;
  }

  return {
    ...post,
    tags: JSON.parse(post.tags || "[]") as string[],
    images: JSON.parse(post.images || "[]") as string[],
    hasUpvoted,
  };
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const boardSlug = formData.get("boardSlug") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagsStr = (formData.get("tags") as string) || "";
  const file = formData.get("file") as File | null;
  const imageFiles = formData.getAll("images") as File[];

  const board = await db.board.findUnique({ where: { slug: boardSlug } });
  if (!board) return { error: "板块不存在" };

  if (!title) return { error: "请输入标题" };
  if (!content) return { error: "请输入内容" };

  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

  // Setup file storage
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Handle file attachment
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileType: string | null = null;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    await writeFile(path.join(uploadDir, uniqueName), Buffer.from(bytes));
    fileUrl = `/uploads/${uniqueName}`;
    fileName = file.name;
    fileSize = file.size;
    fileType = file.type;
  }

  // Save images
  const imageUrls: string[] = [];
  for (const img of imageFiles) {
    if (img && img.size > 0) {
      const bytes = await img.arrayBuffer();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${img.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      await writeFile(path.join(uploadDir, uniqueName), Buffer.from(bytes));
      imageUrls.push(`/uploads/${uniqueName}`);
    }
  }

  const post = await db.post.create({
    data: {
      title,
      content,
      tags: JSON.stringify(tags),
      fileUrl,
      fileName,
      fileSize,
      fileType,
      images: JSON.stringify(imageUrls),
      authorId: session.user.id,
      boardId: board.id,
    },
  });

  await db.board.update({
    where: { id: board.id },
    data: { postCount: { increment: 1 } },
  });

  revalidatePath(`/forum/${boardSlug}`);
  return { success: true, id: post.id };
}

export async function toggleUpvote(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const userId = session.user.id;

  const existing = await db.postUpvote.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.postUpvote.delete({ where: { id: existing.id } });
    await db.post.update({
      where: { id: postId },
      data: { upvotes: { decrement: 1 } },
    });
    revalidatePath(`/forum`);
    return { upvoted: false };
  } else {
    await db.postUpvote.create({ data: { userId, postId } });
    await db.post.update({
      where: { id: postId },
      data: { upvotes: { increment: 1 } },
    });

    // Notify post author
    const post = await db.post.findUnique({ where: { id: postId }, select: { title: true, authorId: true } });
    if (post && post.authorId !== userId) {
      await db.notification.create({
        data: {
          userId: post.authorId,
          type: "upvote",
          title: `有人点赞了你的帖子`,
          body: post.title,
          link: `/forum`,
        },
      });
    }

    revalidatePath(`/forum`);
    return { upvoted: true };
  }
}

export async function addPostReply(postId: string, content: string, parentId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };
  if (!content.trim()) return { error: "请输入回复内容" };

  const post = await db.post.findUnique({ where: { id: postId }, select: { title: true, authorId: true } });
  if (!post) return { error: "帖子不存在" };

  await db.comment.create({
    data: {
      content,
      authorId: session.user.id,
      postId,
      parentId: parentId || null,
    },
  });

  // Notify post author
  if (post.authorId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "reply",
        title: `有人回复了你的帖子`,
        body: content.slice(0, 100),
        link: `/forum/${parentId ? "" : postId}`,
      },
    });
  }

  revalidatePath(`/forum`);
  return { success: true };
}

// Increment view count (called client-side on mount)
export async function incrementPostViews(postId: string) {
  await db.post.update({
    where: { id: postId },
    data: { views: { increment: 1 } },
  });
}
