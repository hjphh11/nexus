import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadBlob } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const images = formData.getAll("images") as File[];

    if (files.length === 0 && images.length === 0) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const uploadedFiles: { url: string; name: string; size: number; type: string }[] = [];
    for (const f of files) {
      if (!f || f.size === 0) continue;
      const url = await uploadBlob(f, "resources");
      uploadedFiles.push({ url, name: f.name, size: f.size, type: f.type });
    }

    const uploadedImages: string[] = [];
    for (const img of images) {
      if (!img || img.size === 0) continue;
      uploadedImages.push(await uploadBlob(img, "resources"));
    }

    return NextResponse.json({ success: true, files: uploadedFiles, images: uploadedImages });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
  }
}
