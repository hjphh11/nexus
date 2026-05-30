"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Clock,
  User,
  Send,
  MessageSquare,
  CornerDownRight,
  Download,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getPostById, addPostReply, incrementPostViews } from "@/actions/forum";
import { UpvoteButton } from "@/components/forum/upvote-button";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ boardSlug: string; postId: string }>;
}) {
  const { boardSlug, postId } = use(params);
  const { data: session } = useSession();
  const [post, setPost] = useState<Awaited<ReturnType<typeof getPostById>>>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPostById(postId).then(setPost);
    incrementPostViews(postId);
  }, [postId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPosting(true);
    const result = await addPostReply(postId, replyContent, replyParentId ?? undefined);
    setPosting(false);
    if (result?.error) { setError(result.error); return; }
    setReplyContent("");
    setReplyParentId(null);
    getPostById(postId).then(setPost);
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-surface border border-border/30 p-20 text-center shimmer-bg" />
      </div>
    );
  }

  const tags = post.tags as string[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/forum" className="hover:text-foreground transition-colors">论坛</Link>
          <span>/</span>
          <Link href={`/forum/${boardSlug}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
            {post.board.name}
          </Link>
        </div>

        {/* Post Header */}
        <article>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/30">
            <span className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-mono text-primary">
                  {(post.author?.name || "?").charAt(0)}
                </span>
              </div>
              {post.author?.name || "匿名"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(post.createdAt).toLocaleString("zh-CN")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {post.views}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10 text-primary/80 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-6">
            {post.content}
          </div>

          {/* Post images — vertical stack */}
          {(post as any).images?.length > 0 && (
            <div className="mb-8 space-y-3">
              {(post as any).images.map((img: string, i: number) => (
                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img}
                    alt={`图片 ${i + 1}`}
                    className="w-full max-w-2xl rounded-xl border border-border/30 hover:border-primary/20 transition-all cursor-pointer object-cover"
                    style={{ maxHeight: 480 }}
                  />
                </a>
              ))}
            </div>
          )}

          {/* File attachment */}
          {(post as any).fileUrl && (
            <div className="mb-8">
              <div className="flex items-center justify-between rounded-xl bg-surface border border-border/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{(post as any).fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {((post as any).fileSize / 1024 / 1024).toFixed(1)} MB · {(post as any).fileType || "未知"}
                    </p>
                  </div>
                </div>
                <a
                  href={(post as any).fileUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-sm font-medium transition-all"
                >
                  下载
                </a>
              </div>
            </div>
          )}

          {/* Upvote */}
          <div className="flex items-center gap-4 mb-10 pb-8 border-b border-border/30">
            <UpvoteButton
              postId={post.id}
              initialUpvotes={post.upvotes}
              initialUpvoted={post.hasUpvoted}
            />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {post._count.comments} 条回复
            </span>
          </div>
        </article>

        {/* Replies */}
        <section>
          <h2 className="text-sm font-heading font-semibold text-foreground mb-6">
            回复 ({post._count.comments})
          </h2>

          {post.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无回复，来发表第一条</p>
          ) : (
            <div className="space-y-4 mb-10">
              {post.comments.map((comment) => (
                <div key={comment.id}>
                  <div className="rounded-xl bg-surface border border-border/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-primary">
                          {(comment.author?.name || "?").charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-foreground font-medium">{comment.author?.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed ml-8">{comment.content}</p>
                    <button
                      onClick={() => setReplyParentId(replyParentId === comment.id ? null : comment.id)}
                      className="ml-8 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3" /> 回复
                    </button>
                  </div>

                  {/* Nested replies */}
                  {comment.replies.length > 0 && (
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-border/30 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="rounded-xl bg-surface border border-border/30 p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-md bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                              <span className="text-[9px] font-mono text-secondary">
                                {(reply.author?.name || "?").charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-foreground font-medium">{reply.author?.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed ml-7">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reply Form */}
        {session?.user ? (
          <form onSubmit={handleReply} className="space-y-3">
            {replyParentId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CornerDownRight className="w-3 h-3" />
                正在回复一条评论
                <button type="button" onClick={() => setReplyParentId(null)} className="text-accent hover:underline">取消</button>
              </div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all resize-none"
            />
            {error && <p className="text-xs text-accent">{error}</p>}
            <button
              type="submit"
              disabled={posting || !replyContent.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {posting ? "发送中..." : "发表回复"}
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-surface border border-border/30 text-center">
            <Link href="/auth" className="text-sm text-primary hover:underline">登录</Link>
            <span className="text-sm text-muted-foreground"> 后参与回复</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
