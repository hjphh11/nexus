"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  Download,
  MessageSquare,
  Clock,
  User,
  ArrowLeft,
  Send,
  FileText,
  Database,
  Code,
  Image,
  Video,
  Music,
  Archive,
  Link as LinkIcon,
} from "lucide-react";
import { getResourceById, incrementViews, addComment } from "@/actions/resources";
import { useSession } from "next-auth/react";
import { ImageCarousel } from "@/components/effects/image-carousel";

const typeIcons: Record<string, React.ElementType> = {
  DOCUMENT: FileText, DATASET: Database, CODE: Code,
  IMAGE: Image, VIDEO: Video, AUDIO: Music, ARCHIVE: Archive, OTHER: FileText,
};
const typeLabels: Record<string, string> = {
  DOCUMENT: "文档", DATASET: "数据集", CODE: "代码",
  IMAGE: "图片", VIDEO: "视频", AUDIO: "音频", ARCHIVE: "压缩包", OTHER: "其他",
};

export default function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [resource, setResource] = useState<Awaited<ReturnType<typeof getResourceById>>>(null);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getResourceById(id).then(setResource);
    incrementViews(id);
  }, [id]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPosting(true);
    const result = await addComment(id, comment);
    setPosting(false);
    if (result?.error) { setError(result.error); return; }
    setComment("");
    getResourceById(id).then(setResource);
  }

  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-surface border border-border/30 p-20 text-center shimmer-bg" />
      </div>
    );
  }

  const tags = (resource.tags ?? []) as unknown as string[];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Back */}
        <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回资源广场
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              {resource.type === "IMAGE" ? <Image className="w-5 h-5 text-primary" /> :
               resource.type === "VIDEO" ? <Video className="w-5 h-5 text-primary" /> :
               resource.type === "AUDIO" ? <Music className="w-5 h-5 text-primary" /> :
               resource.type === "CODE" ? <Code className="w-5 h-5 text-primary" /> :
               resource.type === "DATASET" ? <Database className="w-5 h-5 text-primary" /> :
               resource.type === "ARCHIVE" ? <Archive className="w-5 h-5 text-primary" /> :
               <FileText className="w-5 h-5 text-primary" />}
            </div>
            <span className="text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-lg bg-surface border border-border/30">
              {typeLabels[resource.type] ?? resource.type}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {resource.author?.name || "匿名"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(resource.createdAt).toLocaleDateString("zh-CN")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {resource.views} 浏览
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> {resource.downloads} 下载
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> {resource._count.comments} 评论
            </span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 text-primary/80 font-mono">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Image Carousel */}
        {resource.images && resource.images.length > 0 && (
          <ImageCarousel images={resource.images} className="mb-10" />
        )}

        {/* Description */}
        {resource.description && (
          <div className="mb-10">
            <h2 className="text-sm font-heading font-semibold text-foreground mb-3">描述</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-xl bg-surface border border-border/30 p-6">
              {resource.description}
            </div>
          </div>
        )}

        {/* File info & download */}
        {resource.fileUrl && (
          <div className="mb-10">
            <h2 className="text-sm font-heading font-semibold text-foreground mb-3">文件</h2>
            <div className="flex items-center justify-between rounded-xl bg-surface border border-border/30 p-5">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary/60" />
                <div>
                  <p className="text-sm text-foreground font-medium">{resource.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(1)} MB` : ""} · {resource.fileType || "未知类型"}
                  </p>
                </div>
              </div>
              <a
                href={resource.fileUrl}
                download
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:neon-glow transition-all"
              >
                <Download className="w-4 h-4" /> 下载
              </a>
            </div>
          </div>
        )}

        {/* Drive link */}
        {(resource as any).driveUrl && (
          <div className="mb-10">
            <h2 className="text-sm font-heading font-semibold text-foreground mb-3">网盘下载</h2>
            <div className="flex items-center justify-between rounded-xl bg-surface border border-border/30 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">网盘链接</p>
                  <p className="text-xs text-muted-foreground">
                    {(resource as any).driveCode ? `提取码: ${(resource as any).driveCode}` : "无提取码"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(resource as any).driveCode && (
                  <span className="text-xs font-mono text-muted-foreground bg-surface-hover px-2.5 py-1.5 rounded-lg border border-border/30 select-all">
                    {(resource as any).driveCode}
                  </span>
                )}
                <a
                  href={(resource as any).driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
                >
                  <LinkIcon className="w-4 h-4" /> 打开
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground mb-4">
            评论 ({resource._count.comments})
          </h2>

          {/* Comment form */}
          {session?.user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex gap-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all resize-none"
                />
              </div>
              {error && <p className="text-xs text-accent mt-2">{error}</p>}
              <button
                type="submit"
                disabled={posting || !comment.trim()}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? "发送中..." : "发表评论"}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 rounded-xl bg-surface border border-border/30 text-center">
              <Link href="/auth" className="text-sm text-primary hover:underline">
                登录
              </Link>
              <span className="text-sm text-muted-foreground"> 后参与评论</span>
            </div>
          )}

          {/* Comment list */}
          {resource.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无评论</p>
          ) : (
            <div className="space-y-4">
              {resource.comments.map((c) => (
                <div key={c.id} className="rounded-xl bg-surface border border-border/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-primary">
                        {(c.author?.name || "?").charAt(0)}
                      </span>
                    </div>
                    <span className="text-xs text-foreground font-medium">{c.author?.name || "匿名"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
