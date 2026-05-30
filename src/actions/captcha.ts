"use server";

const captchaStore = new Map<string, { code: string; expires: number }>();

// Clean expired captchas periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of captchaStore) {
    if (now > v.expires) captchaStore.delete(k);
  }
}, 60000);

export async function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const id = Math.random().toString(36).slice(2, 10);
  captchaStore.set(id, { code, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry
  return { id, code };
}

export async function validateCaptcha(id: string, input: string) {
  const entry = captchaStore.get(id);
  if (!entry || Date.now() > entry.expires) return false;
  captchaStore.delete(id); // one-time use
  return entry.code.toUpperCase() === input.toUpperCase();
}
