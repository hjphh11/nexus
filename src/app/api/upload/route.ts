import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/auth";

async function saveFile(f: File, dir: string): Promise<string> {
  const bytes = await f.arrayBuffer();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await writeFile(path.join(dir, name), Buffer.from(bytes));
  return name;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string) || "";
  const type = (formData.get("type") as string) || "OTHER";
  const tagsStr = (formData.get("tags") as string) || "";
  const driveUrl = (formData.get("driveUrl") as string) || null;
  const driveCode = (formData.get("driveCode") as string) || null;

  // Support multiple files
  const files = formData.getAll("files") as File[];
  const imageFiles = formData.getAll("images") as File[];

  if (!title && files.length === 0) {
    return NextResponse.json({ error: "请输入资源名称或选择文件" }, { status: 400 });
  }

  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const imageUrls: string[] = [];
  for (const img of imageFiles) {
    if (img?.size > 0) imageUrls.push(`/uploads/${await saveFile(img, uploadDir)}`);
  }

  // Create a resource for EACH file (batch upload)
  const createdIds: string[] = [];

  if (files.length === 0) {
    // No files — create one resource (e.g. drive link only)
    const resource = await db.resource.create({
      data: {
        title: title || "未命名资源",
        description, type,
        tags: JSON.stringify(tags),
        driveUrl, driveCode,
        images: JSON.stringify(imageUrls),
        authorId: session.user.id,
      },
    });
    createdIds.push(resource.id);
  } else {
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const name = await saveFile(file, uploadDir);
      const resource = await db.resource.create({
        data: {
          title: files.length > 1 ? `${title || file.name} (${file.name})` : (title || file.name),
          description, type,
          tags: JSON.stringify(tags),
          fileUrl: `/uploads/${name}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          driveUrl: files.length === 1 ? driveUrl : null,
          driveCode: files.length === 1 ? driveCode : null,
          images: JSON.stringify(imageUrls),
          authorId: session.user.id,
        },
      });
      createdIds.push(resource.id);
    }
  }

  return NextResponse.json({
    success: true,
    ids: createdIds,
    id: createdIds[0],
    count: createdIds.length,
  });
}
