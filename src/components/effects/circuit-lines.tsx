"use client";

import { useEffect, useRef } from "react";

export function CircuitLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Generate circuit paths
    const nodes: { x: number; y: number }[] = [];
    const nodeCount = 30;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
      ctx.lineWidth = 1;

      // Draw horizontal and vertical lines from nodes
      nodes.forEach((node) => {
        // Horizontal trace
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        // Right angle traces
        const targetNode = nodes[Math.floor(Math.random() * nodeCount)];
        const midX = (node.x + targetNode.x) / 2;

        // L-shaped circuit traces
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(midX + (Math.random() - 0.5) * 40, node.y);
        ctx.lineTo(midX + (Math.random() - 0.5) * 40, targetNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Dot at node
        ctx.fillStyle = "rgba(0, 240, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    draw();
    const interval = setInterval(draw, 3000);

    return () => {
      window.removeEventListener("resize", resize);
      clearInterval(interval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-40"
      aria-hidden="true"
    />
  );
}
