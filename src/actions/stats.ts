"use server";

import { db } from "@/lib/db";

export async function getPublicStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [resources, posts, users, todayActivity] = await Promise.all([
    db.resource.count(),
    db.post.count(),
    db.user.count(),
    // Today's activity: new resources + new posts + new comments
    Promise.all([
      db.resource.count({ where: { createdAt: { gte: today } } }),
      db.post.count({ where: { createdAt: { gte: today } } }),
      db.comment.count({ where: { createdAt: { gte: today } } }),
    ]),
  ]);

  return {
    users,
    resources,
    posts,
    todayActive: todayActivity[0] + todayActivity[1] + todayActivity[2],
  };
}
