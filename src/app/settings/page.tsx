"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Calendar, Lock, Bell, Save, Check, X, Eye, EyeOff, Camera } from "lucide-react";
import { updateProfile, changePassword, getNotifySettings, updateNotifySetting } from "@/actions/settings";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [notify, setNotify] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    getNotifySettings().then((s) => setNotify(s));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/settings/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setAvatarLoading(false);
    if (data?.success) {
      setAvatarUrl(data.imageUrl);
      setMsg({ type: "success", text: "头像已更新" });
      await updateSession(); // refresh session from DB (picks up new image)
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: "error", text: data?.error || "上传失败" });
    }
  }

  async function handleToggle(key: string) {
    const next = !notify[key];
    setToggling(key);
    setNotify((prev) => ({ ...prev, [key]: next }));
    await updateNotifySetting(key, next);
    setToggling(null);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name", name);
    const r = await updateProfile(fd);
    setSaving(false);
    setMsg(r?.success ? { type: "success", text: r.message || "已更新" } : { type: "error", text: r?.error || "失败" });
    if (r?.success) {
      setEditName(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("currentPassword", pwForm.current);
    fd.append("newPassword", pwForm.newPw);
    fd.append("confirmPassword", pwForm.confirm);
    const r = await changePassword(fd);
    setSaving(false);
    setMsg(r?.success ? { type: "success", text: r.message || "已修改" } : { type: "error", text: r?.error || "失败" });
    if (r?.success) {
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setMsg(null), 3000);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          <span className="text-primary">//</span> 设置
        </h1>
        <p className="text-muted-foreground mb-10">管理你的账户信息和偏好设置</p>

        {/* Toast */}
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-3 rounded-xl flex items-center gap-2 text-sm ${
                msg.type === "success" ? "bg-success/10 border border-success/20 text-success" : "bg-accent/10 border border-accent/20 text-accent"
              }`}
            >
              {msg.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1) Profile */}
        <div className="relative rounded-2xl bg-surface border border-border/40 overflow-hidden mb-6">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="p-8">
            <h2 className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground mb-6">
              <User className="w-4 h-4 text-primary" /> 编辑资料
            </h2>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              <label className="relative group cursor-pointer shrink-0">
                <div className="w-20 h-20 rounded-2xl border border-primary/20 flex items-center justify-center overflow-hidden">
                  {avatarUrl || session?.user?.image ? (
                    <img
                      src={avatarUrl || session?.user?.image || ""}
                      alt="头像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold font-mono text-primary">
                      {(session?.user?.name || session?.user?.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarLoading} />
              </label>

              <div className="flex-1 space-y-4">
                <form onSubmit={handleUpdateProfile}>
                  <label className="block text-xs text-muted-foreground mb-1.5">用户名</label>
                  {editName ? (
                    <div className="flex gap-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={session?.user?.name || ""}
                        className="flex-1 px-3 py-2 rounded-lg bg-surface-hover border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/40"
                        autoFocus
                      />
                      <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-sm font-medium transition-all">
                        <Save className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditName(false)} className="px-3 py-2 rounded-lg bg-surface-hover border border-border/50 text-muted-foreground hover:text-foreground text-sm transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setName(session?.user?.name || ""); setEditName(true); }}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 cursor-pointer hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{session?.user?.name || "—"}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">点击编辑</span>
                    </div>
                  )}
                </form>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">邮箱</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover/50 border border-border/30">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-sm text-muted-foreground">{session?.user?.email || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2) Password */}
        <div className="relative rounded-2xl bg-surface border border-border/40 overflow-hidden mb-6">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
          <div className="p-8">
            <h2 className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground mb-6">
              <Lock className="w-4 h-4 text-secondary" /> 修改密码
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">当前密码</label>
                <input
                  type="password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                  required
                  placeholder="输入当前密码"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">新密码</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={pwForm.newPw}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="至少 6 位"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">确认新密码</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 text-sm font-medium transition-all">
                <Save className="w-3.5 h-3.5" /> {saving ? "保存中..." : "修改密码"}
              </button>
            </form>
          </div>
        </div>

        {/* 3) Notifications */}
        <div className="relative rounded-2xl bg-surface border border-border/40 overflow-hidden mb-6">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-chart-4/30 to-transparent" />
          <div className="p-8">
            <h2 className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground mb-6">
              <Bell className="w-4 h-4 text-chart-4" /> 通知偏好
            </h2>

            <div className="space-y-3 max-w-sm">
              {[
                { key: "forumReply", label: "论坛回复通知", desc: "有人回复你的帖子时通知" },
                { key: "resourceComment", label: "资源评论通知", desc: "有人评论你的资源时通知" },
                { key: "upvote", label: "点赞通知", desc: "有人点赞你的帖子时通知" },
                { key: "system", label: "系统公告", desc: "平台更新和维护通知" },
              ].map((item) => {
                const checked = notify[item.key] ?? true;
                const loading = toggling === item.key;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-hover border border-border/30">
                    <div>
                      <p className="text-sm text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      disabled={loading}
                      className={`w-10 h-6 rounded-full transition-all duration-200 relative ${checked ? "bg-primary/40" : "bg-border"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4) Account info */}
        <div className="relative rounded-2xl bg-surface border border-border/40 overflow-hidden">
          <div className="p-8">
            <h2 className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground mb-6">
              <Shield className="w-4 h-4 text-primary" /> 账户信息
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-hover border border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" /> 注册时间
                </div>
                <div className="text-sm text-foreground font-mono">
                  {session?.user ? new Date().toLocaleDateString("zh-CN") : "—"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-hover border border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Shield className="w-3 h-3" /> 账户角色
                </div>
                <div className="text-sm text-foreground font-mono">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(session?.user as any)?.role === "ADMIN" ? "管理员" : "用户"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
