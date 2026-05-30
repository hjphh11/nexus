"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent";
  hover?: boolean;
}

const glowColors = {
  primary: "rgba(0, 240, 255, 0.3)",
  secondary: "rgba(124, 58, 237, 0.3)",
  accent: "rgba(244, 63, 94, 0.3)",
};

export function NeonCard({
  children,
  className,
  glowColor = "primary",
  hover = true,
}: NeonCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!hover || !ref.current) return;
    const el = ref.current;
    const line = lineRef.current;
    const glow = glowColors[glowColor];

    const ctx = gsap.context(() => {
      const enterTl = gsap.timeline({ paused: true })
        .to(el, { scale: 1.02, duration: 0.35, ease: "power2.out" }, 0)
        .to(el, { boxShadow: `0 0 30px ${glow}, 0 0 60px rgba(0, 240, 255, 0.05)`, duration: 0.35 }, 0)
        .to(el, { borderColor: `${glow.replace("0.3", "0.4")}`, duration: 0.35 }, 0);
      if (line) enterTl.to(line, { opacity: 1, duration: 0.3 }, 0);

      const leaveTl = gsap.timeline({ paused: true })
        .to(el, { scale: 1, duration: 0.4, ease: "power2.in" }, 0)
        .to(el, { boxShadow: "none", duration: 0.4 }, 0)
        .to(el, { borderColor: "", duration: 0.4 }, 0);
      if (line) leaveTl.to(line, { opacity: 0.6, duration: 0.3 }, 0);

      el.addEventListener("mouseenter", () => {
        tweenRef.current?.kill();
        tweenRef.current = enterTl.restart().play() as unknown as gsap.core.Tween;
      });
      el.addEventListener("mouseleave", () => {
        tweenRef.current?.kill();
        tweenRef.current = leaveTl.restart().play() as unknown as gsap.core.Tween;
      });
    }, ref);

    return () => ctx.revert();
  }, [hover, glowColor]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl bg-surface border border-border/50 overflow-hidden",
        "transition-colors duration-300",
        className
      )}
    >
      {/* Subtle top glow line */}
      <div
        ref={lineRef}
        className="absolute top-0 left-4 right-4 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColors[glowColor]}, transparent)`,
        }}
      />

      {children}
    </div>
  );
}
