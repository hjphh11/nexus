import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadBlob } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
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

    const files = formData.getAll("files") as File[];
    const imageFiles = formData.getAll("images") as File[];

    if (!title && files.length === 0) {
      return NextResponse.json({ error: "请输入资源名称或选择文件" }, { status: 400 });
    }

    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

    const imageUrls: string[] = [];
    for (const img of imageFiles) {
      if (img?.size > 0) imageUrls.push(await uploadBlob(img, "resources"));
    }

    const createdIds: string[] = [];

    if (files.length === 0) {
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
        const url = await uploadBlob(file, "resources");
        const resource = await db.resource.create({
          data: {
            title: files.length > 1 ? `${title || file.name} (${file.name})` : (title || file.name),
            description, type,
            tags: JSON.stringify(tags),
            fileUrl: url,
            fileKey: url,
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
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
  }
}
