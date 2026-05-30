import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const boardSlug = formData.get("boardSlug") as string;
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagsStr = (formData.get("tags") as string) || "";
  const file = formData.get("file") as File | null;
  const imageFiles = formData.getAll("images") as File[];

  const board = await db.board.findUnique({ where: { slug: boardSlug } });
  if (!board) return NextResponse.json({ error: "板块不存在" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "请输入标题" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "请输入内容" }, { status: 400 });

  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  async function saveFile(f: File): Promise<string> {
    const bytes = await f.arrayBuffer();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    await writeFile(path.join(uploadDir, name), Buffer.from(bytes));
    return `/uploads/${name}`;
  }

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let fileType: string | null = null;

  if (file && file.size > 0) {
    fileUrl = await saveFile(file);
    fileName = file.name;
    fileSize = file.size;
    fileType = file.type;
  }

  const imageUrls: string[] = [];
  for (const img of imageFiles) {
    if (img && img.size > 0) {
      imageUrls.push(await saveFile(img));
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

  return NextResponse.json({ success: true, id: post.id });
}
