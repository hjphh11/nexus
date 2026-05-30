"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X } from "lucide-react";
import SliderCaptcha from "rc-slider-captcha";
import { generateCaptchaImages } from "@/lib/captcha-images";

interface ClickCaptchaProps {
  onVerify: (verified: boolean) => void;
  text?: string;
}

export function ClickCaptcha({ onVerify, text = "点击验证" }: ClickCaptchaProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "verified" | "failed">("idle");

  function handleClose() {
    setOpen(false);
    if (status === "failed") setStatus("idle");
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(true); if (status === "failed") setStatus("idle"); }}
        disabled={status === "verified"}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
          status === "verified"
            ? "bg-success/10 text-success border-success/20 cursor-default"
            : "bg-surface text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground"
        }`}
      >
        {status === "verified" ? (
          <>
            <Check className="w-3.5 h-3.5" /> 验证通过
          </>
        ) : status === "failed" ? (
          <>
            <X className="w-3.5 h-3.5 text-accent" /> 验证失败，重试
          </>
        ) : (
          <>
            <Shield className="w-3.5 h-3.5" /> {text}
          </>
        )}
      </button>

      {/* Popup modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative rounded-2xl bg-surface border border-border/40 shadow-2xl overflow-hidden"
              style={{ width: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/20">
                <span className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> 安全验证
                </span>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Captcha */}
              <div className="p-6">
                <p className="text-xs text-muted-foreground mb-3 text-center">拖动滑块使拼图对齐</p>
                <SliderCaptcha
                  mode="embed"
                  request={generateCaptchaImages}
                  onVerify={async () => {
                    setStatus("verified");
                    onVerify(true);
                    setTimeout(() => setOpen(false), 800);
                  }}
                  bgSize={{ width: 260, height: 150 }}
                  puzzleSize={{ width: 42 }}
                  style={{ width: 260 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
