import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function saveFile(f: File, dir: string): Promise<string> {
  const bytes = await f.arrayBuffer();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(bytes));
  return name;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  if (resource.authorId !== session.user.id) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string) || "";
  const type = (formData.get("type") as string) || resource.type;
  const tagsStr = (formData.get("tags") as string) || "";
  const file = formData.get("file") as File | null;
  const removeFile = formData.get("removeFile") === "true";
  const removeImages = formData.get("removeImages") as string || ""; // comma-separated index list
  const newImages = formData.getAll("images") as File[];

  if (!title) {
    return NextResponse.json({ error: "请输入资源名称" }, { status: 400 });
  }

  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // Handle file: remove old, upload new
  let fileUrl = resource.fileUrl;
  let fileName = resource.fileName;
  let fileSize = resource.fileSize;
  let fileType = resource.fileType;

  if (removeFile && resource.fileUrl) {
    const oldPath = path.join(process.cwd(), "public", resource.fileUrl);
    if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
    fileUrl = null; fileName = null; fileSize = null; fileType = null;
  }

  if (file && file.size > 0) {
    // Remove old file if exists
    if (resource.fileUrl) {
      const oldPath = path.join(process.cwd(), "public", resource.fileUrl);
      if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
    }
    const name = await saveFile(file, uploadDir);
    fileUrl = `/uploads/${name}`;
    fileName = file.name;
    fileSize = file.size;
    fileType = file.type;
  }

  // Handle images: remove selected, add new
  const existingImages: string[] = JSON.parse(resource.images || "[]");
  const removeIndexes = removeImages.split(",").map(Number).filter((n) => !isNaN(n)).sort((a, b) => b - a);
  for (const idx of removeIndexes) {
    if (idx >= 0 && idx < existingImages.length) {
      const imgPath = path.join(process.cwd(), "public", existingImages[idx]);
      if (existsSync(imgPath)) await unlink(imgPath).catch(() => {});
      existingImages.splice(idx, 1);
    }
  }
  for (const img of newImages) {
    if (img && img.size > 0) {
      const name = await saveFile(img, uploadDir);
      existingImages.push(`/uploads/${name}`);
    }
  }

  await db.resource.update({
    where: { id },
    data: {
      title,
      description,
      type,
      tags: JSON.stringify(tags),
      fileUrl,
      fileName,
      fileSize,
      fileType,
      images: JSON.stringify(existingImages),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/resources");
  revalidatePath(`/resources/${id}`);

  return NextResponse.json({ success: true });
}
