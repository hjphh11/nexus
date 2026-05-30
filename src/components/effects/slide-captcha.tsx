"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Check } from "lucide-react";

export function SlideCaptcha({
  onVerify,
  width = 320,
}: {
  onVerify: (verified: boolean) => void;
  width?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [verified, setVerified] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const maxX = width - 52;
  const trackWidth = width - 52;

  function handleStart(clientX: number) {
    if (verified) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offset = clientX - rect.left - 26;
    setSliderX(Math.max(0, Math.min(offset, maxX)));
    setDragging(true);
  }

  function handleMove(clientX: number) {
    if (!dragging || verified) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offset = clientX - rect.left - 26;
    const x = Math.max(0, Math.min(offset, maxX));
    setSliderX(x);
    if (x >= maxX - 5) {
      setVerified(true);
      setSliderX(maxX);
      setDragging(false);
      onVerify(true);
    }
  }

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleEnd = () => setDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, maxX]);

  return (
    <div
      ref={trackRef}
      className="relative rounded-full bg-surface-hover border border-border/50 select-none overflow-hidden"
      style={{ width, height: 44 }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
    >
      {/* Background track fill */}
      <div
        className="absolute inset-0 bg-primary/10 transition-all duration-200 rounded-full"
        style={{ width: verified ? "100%" : `${(sliderX / maxX) * 100}%` }}
      />

      {/* Track text */}
      {!verified && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            请按住滑块拖到最右边
          </span>
        </div>
      )}

      {/* Slider button */}
      <motion.div
        animate={{ x: sliderX }}
        transition={dragging ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
        className={`absolute top-0.5 left-0.5 w-[42px] h-[42px] rounded-full flex items-center justify-center shadow-sm transition-colors ${
          verified ? "bg-success text-white" : "bg-primary text-primary-foreground cursor-grab active:cursor-grabbing"
        }`}
        style={{ touchAction: "none" }}
      >
        {verified ? <Check className="w-4 h-4" /> : <span className="text-lg font-bold">→</span>}
      </motion.div>
    </div>
  );
}
