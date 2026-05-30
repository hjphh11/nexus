import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "请选择图片" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "只支持图片文件" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const uploadDir = path.join(process.cwd(), "public", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "png";
  const name = `${session.user.id}.${ext}`;
  await writeFile(path.join(uploadDir, name), Buffer.from(bytes));

  const imageUrl = `/avatars/${name}?t=${Date.now()}`;

  await db.user.update({
    where: { id: session.user.id as string },
    data: { image: imageUrl },
  });

  revalidatePath("/settings");
  return NextResponse.json({ success: true, imageUrl });
}
