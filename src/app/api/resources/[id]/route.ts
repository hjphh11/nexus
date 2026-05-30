import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { uploadBlob, deleteBlob } from "@/lib/blob";

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
  const removeImages = formData.get("removeImages") as string || "";
  const newImages = formData.getAll("images") as File[];

  if (!title) {
    return NextResponse.json({ error: "请输入资源名称" }, { status: 400 });
  }

  const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

  // Handle file: remove old from blob, upload new
  let fileUrl = resource.fileUrl;
  let fileName = resource.fileName;
  let fileSize = resource.fileSize;
  let fileType = resource.fileType;

  if (removeFile && resource.fileUrl) {
    await deleteBlob(resource.fileUrl);
    fileUrl = null; fileName = null; fileSize = null; fileType = null;
  }

  if (file && file.size > 0) {
    if (resource.fileUrl) await deleteBlob(resource.fileUrl);
    const url = await uploadBlob(file, "resources");
    fileUrl = url;
    fileName = file.name;
    fileSize = file.size;
    fileType = file.type;
  }

  // Handle images: remove selected, add new
  const existingImages: string[] = JSON.parse(resource.images || "[]");
  const removeIndexes = removeImages.split(",").map(Number).filter((n) => !isNaN(n)).sort((a, b) => b - a);
  for (const idx of removeIndexes) {
    if (idx >= 0 && idx < existingImages.length) {
      await deleteBlob(existingImages[idx]);
      existingImages.splice(idx, 1);
    }
  }
  for (const img of newImages) {
    if (img && img.size > 0) {
      const url = await uploadBlob(img, "resources");
      existingImages.push(url);
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
