"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pin,
  Eye,
  MessageSquare,
  Clock,
  User,
  Send,
  Paperclip,
  X,
  Image,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getPosts } from "@/actions/forum";
import { UpvoteButton } from "@/components/forum/upvote-button";

export default function BoardPage({ params }: { params: Promise<{ boardSlug: string }> }) {
  const { boardSlug } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof getPosts>>>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [postImages, setPostImages] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setLoading(true);
    getPosts(boardSlug, { sort, page }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [boardSlug, sort, page]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setPosting(true);
    const fd = new FormData();
    fd.append("boardSlug", boardSlug);
    fd.append("title", title);
    fd.append("content", content);
    fd.append("tags", tags);
    if (file) fd.append("file", file);
    postImages.forEach((img) => fd.append("images", img));
    const res = await fetch("/api/forum", { method: "POST", body: fd });
    const result = await res.json();
    setPosting(false);
    if (result?.error) { setFormError(result.error); return; }
    setShowForm(false);
    setTitle("");
    setContent("");
    setTags("");
    setFile(null);
    setPostImages([]);
    getPosts(boardSlug, { sort, page }).then(setData);
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-surface border border-border/30 p-20 text-center shimmer-bg" />
      </div>
    );
  }

  const { board, posts, total, totalPages } = data;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Breadcrumb */}
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 论坛
        </Link>

        {/* Board Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{board.name}</h1>
            {board.description && (
              <p className="text-muted-foreground text-sm mt-1">{board.description}</p>
            )}
          </div>

          {session?.user ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:neon-glow transition-all"
            >
              <Plus className="w-4 h-4" /> 发帖
            </button>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-all"
            >
              登录发帖
            </Link>
          )}
        </div>

        {/* New Post Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreatePost}
              className="mb-8 overflow-hidden"
            >
              <div className="rounded-xl bg-surface border border-border/40 p-6 space-y-4">
                <input
                  type="text"
                  placeholder="帖子标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                />
                <textarea
                  placeholder="帖子内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all resize-none"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="标签（逗号分隔）"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                  />
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-all">
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline">附件</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 cursor-pointer transition-all">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">图片</span>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => { const files = Array.from(e.target.files || []); setPostImages((p) => [...p, ...files]); }} />
                  </label>
                  <button
                    type="submit"
                    disabled={posting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:neon-glow transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {posting ? "发布中..." : "发布"}
                  </button>
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Paperclip className="w-3 h-3" />
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    <button type="button" onClick={() => setFile(null)} className="text-accent hover:underline"><X className="w-3 h-3" /></button>
                  </div>
                )}
                {/* Post image previews */}
                {postImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {postImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/30 group">
                        <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setPostImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formError && <p className="text-xs text-accent">{formError}</p>}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Sort */}
        <div className="flex items-center gap-4 mb-6">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-surface border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
          >
            <option value="newest">最新</option>
            <option value="popular">最热</option>
          </select>
          <span className="text-xs text-muted-foreground">共 {total} 个帖子</span>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border/30 p-5 h-20 shimmer-bg" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <MessageSquare className="w-10 h-10 text-primary/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">还没有帖子，来做第一个</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/forum/${boardSlug}/${post.id}`}>
                <div className={`group rounded-xl border transition-all duration-200 p-5 ${
                  post.pinned
                    ? "bg-primary/[0.03] border-primary/10 hover:border-primary/30"
                    : "bg-surface border-border/30 hover:border-primary/20 hover:bg-surface-hover"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <h3 className="font-heading font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {post.author?.name || "匿名"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {post.views}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.preventDefault()}>
                      <UpvoteButton
                        postId={post.id}
                        initialUpvotes={post.upvotes}
                      />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" /> {post._count.comments}
                      </span>
                    </div>
                  </div>

                  {(post.tags as string[]).length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {(post.tags as string[]).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary/70">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-xs font-mono transition-all ${
                  page === i + 1
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-surface border border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
