"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, FileText, ArrowRight, Check, X, Tag, Image, Trash2, Plus, Link, HardDrive, Globe } from "lucide-react";

const typeOptions = [
  { value: "DOCUMENT", label: "文档" },
  { value: "DATASET", label: "数据集" },
  { value: "CODE", label: "代码" },
  { value: "IMAGE", label: "图片" },
  { value: "VIDEO", label: "视频" },
  { value: "AUDIO", label: "音频" },
  { value: "ARCHIVE", label: "压缩包" },
  { value: "OTHER", label: "其他" },
];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [tags, setTags] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "drive">("file");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveCode, setDriveCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("tags", tags);
    if (uploadMode === "file") files.forEach((f) => formData.append("files", f));
    if (uploadMode === "drive") {
      formData.append("driveUrl", driveUrl);
      if (driveCode) formData.append("driveCode", driveCode);
    }
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      setLoading(false);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
      setSuccess(`成功上传 ${result.count || 1} 个资源`);
      setFiles([]); setImages([]); setTitle(""); setDescription(""); setTags("");
      setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setLoading(false);
      setError("网络错误，请重试");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          <span className="text-primary">//</span> 上传资源
        </h1>
        <p className="text-muted-foreground mb-10">分享你的资源到 Nexus 平台</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload mode toggle */}
          <div className="flex rounded-xl bg-surface-hover p-1">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                uploadMode === "file"
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="w-4 h-4" /> 本地上传
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("drive")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                uploadMode === "drive"
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" /> 网盘链接
            </button>
          </div>

          {uploadMode === "file" ? (
            /* File drop zone — multi-file */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center ${
                dragOver
                  ? "border-primary/60 bg-primary/5"
                  : files.length > 0
                    ? "border-success/30 bg-success/5"
                    : "border-border/40 hover:border-primary/30"
              }`}
            >
              <div className="space-y-3">
                {files.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover border border-border/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-4 h-4 text-success shrink-0" />
                          <span className="text-sm text-foreground truncate">{f.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                        <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                          className="text-xs text-accent hover:underline shrink-0 ml-2">移除</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFiles([])} className="text-xs text-accent hover:underline">清空全部</button>
                  </div>
                )}
                {files.length === 0 && (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                )}
                <p className="text-foreground font-medium">{files.length > 0 ? "继续添加文件" : "拖拽文件到此处"}</p>
                <p className="text-xs text-muted-foreground">{files.length > 0 ? `已选 ${files.length} 个文件，可继续追加` : "支持批量上传，可多选文件或多次追加"}</p>
                <input
                  type="file"
                  multiple
                  key={files.length}
                  onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
                  className="block mx-auto text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-primary/20 file:bg-primary/10 file:text-primary file:text-sm file:font-medium hover:file:bg-primary/20 file:transition-all file:cursor-pointer"
                />
              </div>
            </div>
          ) : (
            /* Drive link inputs */
            <div className="space-y-4 rounded-2xl bg-surface border border-border/40 p-6">
              <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                <Link className="w-4 h-4 text-primary" />
                网盘链接
              </div>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="网盘链接地址（百度网盘 / 阿里云盘 / 夸克等）"
                className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
              />
              <input
                type="text"
                value={driveCode}
                onChange={(e) => setDriveCode(e.target.value)}
                placeholder="提取码（选填）"
                className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-sm text-foreground font-medium mb-3">
              <Image className="w-3.5 h-3.5 inline mr-1" />
              展示图片（可选，支持多张）
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border/30 group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`预览 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/30 flex items-center justify-center cursor-pointer transition-all">
                <Plus className="w-6 h-6 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImages((prev) => [...prev, ...files]);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-foreground font-medium mb-2">资源名称 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="输入资源名称"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-foreground font-medium mb-2">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="描述这个资源..."
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all resize-none"
            />
          </div>

          {/* Type + Tags row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-foreground font-medium mb-2">资源类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
              >
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-foreground font-medium mb-2">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                标签
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号分隔，如：AI, 教程, Python"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent flex items-center gap-2">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title}
            className="relative w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:neon-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
            ) : (
              <>
                发布资源 <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
