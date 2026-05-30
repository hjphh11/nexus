"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Check } from "lucide-react";

interface PuzzleCaptchaProps {
  onVerify: (verified: boolean) => void;
  width?: number;
}

export function PuzzleCaptcha({ onVerify, width = 320 }: PuzzleCaptchaProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pieceX, setPieceX] = useState(0);
  const [message, setMessage] = useState("");
  const moveLog = useRef<{ t: number; x: number }[]>([]);
  const startTime = useRef(0);

  const trackW = width - 52;
  const pieceW = 52;

  // Random target position between 30% and 70% of track
  const targetX = useMemo(() => Math.floor(trackW * 0.3 + Math.random() * trackW * 0.4), []);

  function handleStart(clientX: number) {
    if (verified) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let x = clientX - rect.left - pieceW / 2;
    x = Math.max(0, Math.min(x, trackW));
    setPieceX(x);
    setDragging(true);
    setMessage("");
    moveLog.current = [{ t: Date.now(), x }];
    startTime.current = Date.now();
    setFailed(false);
  }

  function handleMove(clientX: number) {
    if (!dragging || verified) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let x = clientX - rect.left - pieceW / 2;
    x = Math.max(0, Math.min(x, trackW));
    setPieceX(x);
    moveLog.current.push({ t: Date.now(), x });
  }

  const handleEnd = useCallback(() => {
    if (!dragging || verified) return;
    setDragging(false);

    const elapsed = Date.now() - startTime.current;
    const moves = moveLog.current;
    const finalX = pieceX;
    const dist = Math.abs(finalX - targetX);

    // Bot detection
    let botScore = 0;
    let reason = "";

    // 1. Too fast (< 300ms for this distance)
    if (elapsed < 300) { botScore += 3; reason = "操作过快"; }

    // 2. Too straight (low variance in path)
    if (moves.length >= 5) {
      let straightDeviations = 0;
      const xs = moves.map((m) => m.x);
      const firstX = xs[0], lastX = xs[xs.length - 1];
      if (lastX !== firstX) {
        const slope = (lastX - firstX) / xs.length;
        for (let i = 1; i < xs.length; i++) {
          const expectedX = firstX + slope * i;
          if (Math.abs(xs[i] - expectedX) > 5) straightDeviations++;
        }
        const straightRatio = 1 - straightDeviations / xs.length;
        if (straightRatio > 0.9) { botScore += 2; reason = "轨迹过于平滑"; }
      }
    }

    // 3. Instant teleport (very few move events)
    if (moves.length < 3) { botScore += 3; reason = "移动点过少"; }

    // Verify position tolerance (±5px)
    if (dist > 5) {
      setFailed(true);
      setPieceX(0);
      setMessage("位置不对，请重试");
      return;
    }

    if (botScore >= 3) {
      setFailed(true);
      setPieceX(0);
      setMessage(reason || "请再试一次");
      return;
    }

    // Success!
    setVerified(true);
    setPieceX(targetX);
    onVerify(true);
  }, [dragging, verified, pieceX, targetX, onVerify]);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent) => handleMove(e.clientX);
    const tm = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const up = () => handleEnd();
    document.addEventListener("mousemove", mm);
    document.addEventListener("touchmove", tm, { passive: true });
    document.addEventListener("mouseup", up);
    document.addEventListener("touchend", up);
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("touchmove", tm);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchend", up);
    };
  }, [dragging, handleEnd]);

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="relative rounded-full bg-surface-hover border border-border/50 select-none overflow-hidden"
        style={{ width, height: 48 }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {/* Track background */}
        <div className="absolute inset-0 flex items-center">
          {/* Target zone indicator */}
          <div
            className="absolute h-full bg-success/10 rounded-full transition-opacity"
            style={{ left: targetX - 4, width: pieceW + 8, opacity: dragging ? 0.6 : 0.3 }}
          />
          {/* Gap marker */}
          <div
            className="absolute h-full border-l-2 border-dashed border-success/30"
            style={{ left: targetX + pieceW / 2 }}
          />
        </div>

        {/* Progress fill */}
        <div
          className="absolute inset-0 bg-primary/10 rounded-full transition-all"
          style={{ width: verified ? "100%" : `${Math.min(pieceX / trackW * 100, 100)}%` }}
        />

        {/* Label */}
        {!verified && !dragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              {failed ? "请重试" : "拖动滑块使缺口对齐"}
            </span>
          </div>
        )}

        {/* Slider piece */}
        <motion.div
          animate={{ x: pieceX }}
          transition={dragging ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
          className={`absolute top-0.5 left-0.5 rounded-full flex items-center justify-center shadow-md transition-colors ${
            verified ? "bg-success text-white" : failed ? "bg-accent text-white" : "bg-primary text-primary-foreground cursor-grab active:cursor-grabbing"
          }`}
          style={{ width: pieceW - 1, height: "calc(100% - 4px)", touchAction: "none" }}
        >
          {verified ? (
            <Check className="w-5 h-5" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </motion.div>
      </div>

      {message && (
        <p className="text-xs text-center text-accent">{message}</p>
      )}
      {verified && (
        <p className="text-xs text-center text-success flex items-center justify-center gap-1">
          <Check className="w-3 h-3" /> 验证通过
        </p>
      )}
    </div>
  );
}
