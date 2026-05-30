"use server";

import { db } from "@/lib/db";

export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { resources: [], posts: [] };

  const [resources, posts] = await Promise.all([
    db.resource.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    db.post.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        board: { select: { slug: true } },
      },
    }),
  ]);

  return {
    resources: resources.map((r) => ({ ...r, tags: JSON.parse(r.tags || "[]") })),
    posts: posts.map((p) => ({ ...p, tags: JSON.parse(p.tags || "[]") })),
  };
}
