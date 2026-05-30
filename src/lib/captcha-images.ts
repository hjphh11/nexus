// Generate placeholder captcha images using Canvas (runs in browser)
export async function generateCaptchaImages(): Promise<{
  bgUrl: string;
  puzzleUrl: string;
}> {
  const W = 260;
  const H = 150;
  const pw = 42; // puzzle width

  // Background canvas
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = W;
  bgCanvas.height = H;
  const bgCtx = bgCanvas.getContext("2d")!;

  // Random gradient background
  const hue = Math.floor(Math.random() * 360);
  const hue2 = (hue + 40) % 360;
  const grad = bgCtx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, `hsl(${hue}, 60%, 30%)`);
  grad.addColorStop(0.5, `hsl(${hue2}, 50%, 25%)`);
  grad.addColorStop(1, `hsl(${hue}, 55%, 20%)`);
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, W, H);

  // Add grid lines for texture
  bgCtx.strokeStyle = "rgba(255,255,255,0.04)";
  bgCtx.lineWidth = 1;
  for (let x = 0; x < W; x += 16) { bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, H); bgCtx.stroke(); }
  for (let y = 0; y < H; y += 16) { bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(W, y); bgCtx.stroke(); }

  // Add some random dots
  for (let i = 0; i < 30; i++) {
    bgCtx.fillStyle = `hsla(${(hue + i * 20) % 360}, 40%, 50%, 0.3)`;
    bgCtx.beginPath();
    bgCtx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, Math.PI * 2);
    bgCtx.fill();
  }

  // Random puzzle position (full-height column)
  const px = Math.floor(W * 0.2 + Math.random() * (W * 0.5 - pw));
  const py = 0;

  // Draw puzzle cutout on background
  bgCtx.fillStyle = "rgba(0,0,0,0.5)";
  bgCtx.fillRect(px, py, pw, H);
  bgCtx.strokeStyle = "rgba(255,255,255,0.6)";
  bgCtx.lineWidth = 2;
  bgCtx.setLineDash([4, 4]);
  bgCtx.strokeRect(px + 1, py + 1, pw - 2, H - 2);
  bgCtx.setLineDash([]);

  // Puzzle piece canvas (full height)
  const pCanvas = document.createElement("canvas");
  pCanvas.width = pw;
  pCanvas.height = H;
  const pCtx = pCanvas.getContext("2d")!;

  // Copy the piece from background
  pCtx.drawImage(bgCanvas, px + 3, py + 3, pw - 6, H - 6, 0, 0, pw, H);
  // Brighten slightly
  pCtx.fillStyle = "rgba(255,255,255,0.1)";
  pCtx.fillRect(0, 0, pw, H);
  pCtx.strokeStyle = "rgba(0,240,255,0.8)";
  pCtx.lineWidth = 2;
  pCtx.strokeRect(1, 1, pw - 2, H - 2);

  return {
    bgUrl: bgCanvas.toDataURL("image/png"),
    puzzleUrl: pCanvas.toDataURL("image/png"),
    x: px,
  };
}
