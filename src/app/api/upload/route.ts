import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

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

    // Pre-uploaded files (JSON strings) and image URLs
    const uploadedFilesRaw = formData.getAll("uploadedFiles") as string[];
    const uploadedImages = formData.getAll("uploadedImages") as string[];

    const files = uploadedFilesRaw.map((s) => JSON.parse(s)) as { url: string; name: string; size: number; type: string }[];

    if (!title) {
      return NextResponse.json({ error: "请输入资源名称" }, { status: 400 });
    }

    if (files.length === 0 && !driveUrl) {
      return NextResponse.json({ error: "请先上传文件或填写网盘链接" }, { status: 400 });
    }

    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

    const createdIds: string[] = [];

    if (files.length > 0) {
      for (const f of files) {
        const resource = await db.resource.create({
          data: {
            title: files.length > 1 ? `${title} (${f.name})` : title,
            description, type,
            tags: JSON.stringify(tags),
            fileUrl: f.url,
            fileKey: f.url,
            fileName: f.name,
            fileSize: f.size,
            fileType: f.type,
            driveUrl: files.length === 1 ? driveUrl : null,
            driveCode: files.length === 1 ? driveCode : null,
            images: JSON.stringify(uploadedImages),
            authorId: session.user.id,
          },
        });
        createdIds.push(resource.id);
      }
    } else {
      // Drive-only upload
      const resource = await db.resource.create({
        data: {
          title: title || "未命名资源",
          description, type,
          tags: JSON.stringify(tags),
          driveUrl, driveCode,
          images: JSON.stringify(uploadedImages),
          authorId: session.user.id,
        },
      });
      createdIds.push(resource.id);
    }

    return NextResponse.json({
      success: true,
      ids: createdIds,
      id: createdIds[0],
      count: createdIds.length,
    });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: "发布失败，请重试" }, { status: 500 });
  }
}
