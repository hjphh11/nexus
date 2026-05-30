"use client";

import { useEffect, useRef } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "div";
  glitchOnHover?: boolean;
}

export function GlitchText({
  text,
  className = "",
  as: Tag = "span",
  glitchOnHover = false,
}: GlitchTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!glitchOnHover) return;
    const el = ref.current;
    if (!el) return;

    let interval: NodeJS.Timeout;
    const handleMouseEnter = () => {
      interval = setInterval(() => {
        el.setAttribute("data-text", generateGlitchText(text));
      }, 80);
    };
    const handleMouseLeave = () => {
      clearInterval(interval);
      el.setAttribute("data-text", text);
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      clearInterval(interval);
    };
  }, [text, glitchOnHover]);

  return (
    <Tag ref={ref as never} className={`glitch-text ${className}`} data-text={text}>
      {text}
    </Tag>
  );
}

function generateGlitchText(original: string): string {
  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
  return original
    .split("")
    .map((c) => {
      if (c === " ") return c;
      return Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : c;
    })
    .join("");
}
