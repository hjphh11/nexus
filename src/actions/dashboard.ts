"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id as string;

  const [
    resourceCount,
    postCount,
    resources,
    posts,
    recentComments,
  ] = await Promise.all([
    db.resource.count({ where: { authorId: userId } }),
    db.post.count({ where: { authorId: userId } }),

    // All user resources
    db.resource.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    // Recent posts with board name
    db.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        board: { select: { name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),

    // Recent comments (mixed)
    db.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        resource: { select: { id: true, title: true } },
        post: { select: { id: true, title: true } },
      },
    }),
  ]);

  // Calculate totals
  const totalViews = resources.reduce((sum, r) => sum + r.views, 0);
  const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0);

  return {
    stats: {
      resources: resourceCount,
      posts: postCount,
      views: totalViews,
      upvotes: totalUpvotes,
    },
    recentResources: resources.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]") as string[],
      images: JSON.parse(r.images || "[]") as string[],
    })),
    recentPosts: posts.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags || "[]") as string[],
    })),
    recentComments,
  };
}
