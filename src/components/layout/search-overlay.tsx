"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, MessageSquare, CornerDownLeft, X } from "lucide-react";
import { globalSearch } from "@/actions/search";

type Results = Awaited<ReturnType<typeof globalSearch>>;

export function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ resources: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Ctrl+K keyboard shortcut + custom event for buttons
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openIt = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("open-search-overlay", openIt);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-overlay", openIt);
    };
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else {
      setQuery("");
      setResults({ resources: [], posts: [] });
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({ resources: [], posts: [] }); return; }
    setLoading(true);
    const r = await globalSearch(q);
    setResults(r);
    setLoading(false);
    setSelected(0);
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(debounce.current);
  }, [query, doSearch]);

  const allItems = [
    ...results.resources.map((r) => ({ ...r, kind: "resource" as const })),
    ...results.posts.map((p) => ({ ...p, kind: "post" as const })),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && allItems[selected]) {
      const item = allItems[selected] as { kind: string; id: string; board?: { slug: string } };
      if (item.kind === "resource") router.push(`/resources/${item.id}`);
      else router.push(`/forum/${(item as any).board?.slug || ""}/${item.id}`);
      setOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl mx-4 rounded-2xl bg-surface border border-border/40 shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索资源、帖子..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {query.length < 2 ? (
                <div className="p-10 text-center">
                  <Search className="w-8 h-8 text-primary/10 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">输入关键词搜索</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">可用于搜索资源和论坛帖子</p>
                </div>
              ) : loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map((i) => (<div key={i} className="h-10 rounded-lg bg-surface-hover shimmer-bg" />))}
                </div>
              ) : allItems.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-muted-foreground">没有找到结果</p>
                </div>
              ) : (
                <div className="py-2">
                  {results.resources.length > 0 && (
                    <div className="mb-2">
                      <div className="px-5 py-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">资源</div>
                      {results.resources.map((r, i) => (
                        <button
                          key={r.id}
                          onClick={() => { router.push(`/resources/${r.id}`); setOpen(false); }}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${selected === i ? "bg-primary/5" : "hover:bg-surface-hover"}`}
                        >
                          <FileText className="w-4 h-4 text-primary/60 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{r.title}</p>
                            <p className="text-[11px] text-muted-foreground">{r.author?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.posts.length > 0 && (
                    <div>
                      <div className="px-5 py-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">帖子</div>
                      {results.posts.map((p, i) => {
                        const idx = results.resources.length + i;
                        const postData = p as { id: string; title: string; author?: { name: string | null }; board?: { slug: string } };
                        return (
                          <button
                            key={p.id}
                            onClick={() => { router.push(`/forum/${postData.board?.slug || ""}/${p.id}`); setOpen(false); }}
                            className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${selected === idx ? "bg-primary/5" : "hover:bg-surface-hover"}`}
                          >
                            <MessageSquare className="w-4 h-4 text-secondary/60 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{p.title}</p>
                              <p className="text-[11px] text-muted-foreground">{postData.author?.name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-2 border-t border-border/20 text-[10px] text-muted-foreground/50">
              <span className="flex items-center gap-1">↑↓ 导航</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> 打开</span>
              <span className="flex items-center gap-1">Esc 关闭</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
