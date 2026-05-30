"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleUpvote } from "@/actions/forum";

const particleColors = ["#00f0ff", "#7c3aed", "#f43f5e", "#10b981"];

export function UpvoteButton({
  postId,
  initialUpvotes,
  initialUpvoted = false,
}: {
  postId: string;
  initialUpvotes: number;
  initialUpvoted?: boolean;
}) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    setUpvoted(!upvoted);
    setUpvotes((c) => c + (upvoted ? -1 : 1));

    // Spawn particles
    if (!upvoted) {
      const newParticles = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 60,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      }));
      setParticles((prev) => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
      }, 600);
    }

    const result = await toggleUpvote(postId);
    setLoading(false);

    // Revert on error
    if (result?.error) {
      setUpvoted(!upvoted);
      setUpvotes((c) => c + (upvoted ? 1 : -1));
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
        upvoted
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-surface border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/20"
      )}
    >
      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ backgroundColor: p.color }}
          />
        ))}
      </AnimatePresence>

      <motion.div
        animate={{ scale: upvoted ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <ArrowBigUp
          className={cn("w-4 h-4 transition-colors", upvoted && "fill-current")}
        />
      </motion.div>
      <span>{upvotes}</span>
    </button>
  );
}
