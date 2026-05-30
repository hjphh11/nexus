import { put, del } from "@vercel/blob";

export async function uploadBlob(file: File, prefix: string = "uploads"): Promise<string> {
  const name = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { url } = await put(name, file, { access: "public" });
  return url;
}

export async function deleteBlob(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // blob may have been already deleted
  }
}
