"use client";

import { useEffect, useRef } from "react";

export function HexagonGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const hexSize = 30;
    const rowHeight = hexSize * Math.sqrt(3);
    const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 1;
    const rows = Math.ceil(canvas.height / rowHeight) + 1;

    let offset = 0;

    const drawHex = (cx: number, cy: number, size: number, alpha: number) => {
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + size * Math.cos(angle);
        const y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offset += 0.1;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * hexSize * 1.5 + ((row % 2) * hexSize * 0.75);
          const y = (row * rowHeight + offset) % (rows * rowHeight);
          if (y < -rowHeight || y > canvas.height + rowHeight) continue;

          const centerDist =
            Math.abs(x - canvas.width / 2) / (canvas.width / 2) +
            Math.abs(y - canvas.height / 2) / (canvas.height / 2);
          const alpha = Math.max(0.02, 0.12 - centerDist * 0.1);

          drawHex(x, y, hexSize, alpha);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
