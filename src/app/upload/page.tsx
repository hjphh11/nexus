"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upload } from "@vercel/blob/client";
import { Upload, Check, X, Tag, Image, Trash2, Plus, Link, HardDrive, Globe, CloudUpload, Send, Loader2 } from "lucide-react";

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

interface UploadedFile {
  url: string; name: string; size: number; type: string;
}

interface FileItem {
  file: File;
  status: "pending" | "uploading" | "done";
  progress: number;
  result?: UploadedFile;
}

export default function UploadPage() {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [tags, setTags] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "drive">("file");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveCode, setDriveCode] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function addFiles(newFiles: File[]) {
    setFileItems((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, status: "pending" as const, progress: 0 })),
    ]);
  }

  async function uploadFile(index: number) {
    const item = fileItems[index];
    if (!item || item.status !== "pending") return;

    setFileItems((prev) => prev.map((f, i) => (i === index ? { ...f, status: "uploading" as const, progress: 0 } : f)));

    try {
      const name = `resources/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${item.file.name.replace(/[^a-zA-Z0-9.\\-_]/g, "_")}`;

      const blob = await upload(name, item.file, {
        access: "public",
        handleUploadUrl: "/api/upload/file",
        onUploadProgress: (evt) => {
          setFileItems((prev) => prev.map((f, i) =>
            i === index ? { ...f, progress: evt.percentage } : f
          ));
        },
      });

      setFileItems((prev) => prev.map((f, i) =>
        i === index
          ? {
              ...f,
              status: "done" as const,
              progress: 100,
              result: {
                url: blob.url,
                name: item.file.name,
                size: item.file.size,
                type: item.file.type,
              },
            }
          : f
      ));
    } catch (err: any) {
      setFileItems((prev) => prev.map((f, i) => (i === index ? { ...f, status: "pending" as const, progress: 0 } : f)));
      setError(err?.message || "上传失败，请重试");
    }
  }

  async function uploadImages() {
    if (images.length === 0) return;
    setImageUploading(true);

    try {
      const urls: string[] = [];
      for (const img of images) {
        const name = `resources/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${img.name.replace(/[^a-zA-Z0-9.\\-_]/g, "_")}`;
        const blob = await upload(name, img, { access: "public", handleUploadUrl: "/api/upload/file" });
        urls.push(blob.url);
      }
      setUploadedImages((prev) => [...prev, ...urls]);
      setImages([]);
    } catch (err: any) {
      setError(err?.message || "上传图片失败");
    }
    setImageUploading(false);
  }

  async function handlePublish() {
    const doneFiles = fileItems.filter((f) => f.status === "done" && f.result);
    if (!title) { setError("请输入资源名称"); return; }
    if (uploadMode === "file" && doneFiles.length === 0) {
      setError("请先上传至少一个文件");
      return;
    }
    setError("");
    setPublishing(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("tags", tags);
    doneFiles.forEach((f) => formData.append("uploadedFiles", JSON.stringify(f.result!)));
    uploadedImages.forEach((url) => formData.append("uploadedImages", url));
    if (uploadMode === "drive") {
      formData.append("driveUrl", driveUrl);
      if (driveCode) formData.append("driveCode", driveCode);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`成功发布 ${result.count || 1} 个资源`);
        setFileItems([]); setUploadedImages([]);
        setTitle(""); setDescription(""); setTags("");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("网络错误，请重试");
    }
    setPublishing(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  const doneCount = fileItems.filter((f) => f.status === "done").length;
  const uploadingCount = fileItems.filter((f) => f.status === "uploading").length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          <span className="text-primary">//</span> 上传资源
        </h1>
        <p className="text-muted-foreground mb-10">分享你的资源到 Nexus 平台</p>

        <div className="space-y-8">
          {/* ========== Step 1: 文件上传 ========== */}
          <div className="rounded-2xl bg-surface border border-border/40 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</span>
              <h2 className="text-lg font-heading font-bold text-foreground">上传文件</h2>
              {doneCount > 0 && (
                <span className="text-xs text-success ml-auto">{doneCount} 个文件已就绪</span>
              )}
            </div>

            <div className="flex rounded-xl bg-surface-hover p-1 mb-5">
              <button type="button" onClick={() => setUploadMode("file")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  uploadMode === "file" ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                }`}>
                <HardDrive className="w-4 h-4" /> 本地上传
              </button>
              <button type="button" onClick={() => setUploadMode("drive")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  uploadMode === "drive" ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Globe className="w-4 h-4" /> 网盘链接
              </button>
            </div>

            {uploadMode === "file" ? (
              <>
                {/* File drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-6 text-center mb-4 ${
                    dragOver ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-primary/30"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">拖拽文件到此处</p>
                  <p className="text-xs text-muted-foreground mb-3">支持多文件上传，逐个点击上传按钮</p>
                  <input
                    type="file" multiple key={fileItems.length}
                    onChange={(e) => addFiles(Array.from(e.target.files || []))}
                    className="block mx-auto text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-primary/20 file:bg-primary/10 file:text-primary file:text-sm file:font-medium hover:file:bg-primary/20 file:transition-all file:cursor-pointer"
                  />
                </div>

                {/* File list */}
                {fileItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">待上传文件 ({fileItems.length})</p>
                      <button type="button" onClick={() => setFileItems([])} className="text-xs text-accent hover:underline">清空全部</button>
                    </div>
                    <AnimatePresence>
                      {fileItems.map((item, i) => (
                        <motion.div key={`${item.file.name}-${i}-${item.file.size}`}
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className={`p-3 rounded-xl border transition-colors ${
                            item.status === "done" ? "bg-success/5 border-success/20"
                              : item.status === "uploading" ? "bg-primary/5 border-primary/20"
                              : "bg-surface-hover border-border/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.status === "done" ? (
                                  <Check className="w-4 h-4 text-success shrink-0" />
                                ) : item.status === "uploading" ? (
                                  <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm text-foreground truncate">{item.file.name}</span>
                                <span className="text-[11px] text-muted-foreground shrink-0">{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                              </div>

                              {/* Progress bar */}
                              {item.status === "uploading" && (
                                <div className="mt-2 w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
                                  <motion.div className="h-full rounded-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    transition={{ duration: 0.1 }}
                                  />
                                </div>
                              )}
                              {item.status === "uploading" && (
                                <p className="text-[11px] text-primary mt-1">{item.progress}%</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.status === "pending" && (
                                <button type="button" onClick={() => uploadFile(i)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/25 transition-colors">
                                  <CloudUpload className="w-3 h-3" /> 上传
                                </button>
                              )}
                              {item.status === "done" && (
                                <span className="text-[11px] text-success font-medium whitespace-nowrap">已上传</span>
                              )}
                              <button type="button" onClick={() => setFileItems((prev) => prev.filter((_, j) => j !== i))}
                                className="text-xs text-muted-foreground hover:text-accent transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Image upload */}
                <div className="mt-5">
                  <label className="block text-sm text-foreground font-medium mb-3">
                    <Image className="w-3.5 h-3.5 inline mr-1" />
                    展示图片（可选）
                  </label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border/30 group">
                        <img src={URL.createObjectURL(img)} alt={`预览 ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {images.length > 0 && (
                      <button type="button" onClick={uploadImages} disabled={imageUploading}
                        className="flex items-center gap-1 px-3 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
                        {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                        上传图片
                      </button>
                    )}
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/30 flex items-center justify-center cursor-pointer transition-all">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <input type="file" accept="image/*" multiple
                        onChange={(e) => { const f = Array.from(e.target.files || []); setImages((prev) => [...prev, ...f]); }}
                        className="hidden" />
                    </label>
                  </div>
                  {uploadedImages.length > 0 && (
                    <p className="text-xs text-success">{uploadedImages.length} 张图片已上传</p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <input type="url" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="网盘链接地址（百度网盘 / 阿里云盘 / 夸克等）"
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
                <input type="text" value={driveCode} onChange={(e) => setDriveCode(e.target.value)}
                  placeholder="提取码（选填）"
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
              </div>
            )}
          </div>

          {/* ========== Step 2: 填写信息 ========== */}
          <div className="rounded-2xl bg-surface border border-border/40 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</span>
              <h2 className="text-lg font-heading font-bold text-foreground">填写信息并发布</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground font-medium mb-2">资源名称 *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="输入资源名称"
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
              </div>

              <div>
                <label className="block text-sm text-foreground font-medium mb-2">描述</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder="描述这个资源..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-foreground font-medium mb-2">资源类型</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40 cursor-pointer">
                    {typeOptions.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-foreground font-medium mb-2">
                    <Tag className="w-3.5 h-3.5 inline mr-1" />标签
                  </label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                    placeholder="用逗号分隔，如：AI, 教程, Python"
                    className="w-full px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent flex items-center gap-2">
                <X className="w-4 h-4" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success flex items-center gap-2">
                <Check className="w-4 h-4" /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Publish button */}
          <button onClick={handlePublish}
            disabled={publishing || !title || (uploadMode === "file" && doneCount === 0)}
            className="relative w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:neon-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
            {publishing ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
            ) : (
              <><Send className="w-4 h-4" /> 发布资源 {doneCount > 0 ? `(${doneCount} 个文件)` : ""}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
