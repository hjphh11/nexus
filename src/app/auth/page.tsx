"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, RefreshCw } from "lucide-react";
import { registerUser } from "@/actions/auth";
import { generateCaptcha, validateCaptcha } from "@/actions/captcha";
import { ClickCaptcha } from "@/components/effects/click-captcha";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [confirmPw, setConfirmPw] = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [loginCaptcha, setLoginCaptcha] = useState({ id: "", code: "", input: "" });

  async function refreshCaptcha() {
    const cap = await generateCaptcha();
    setLoginCaptcha((p) => ({ ...p, id: cap.id, code: cap.code }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("password") as string;

    if (mode === "register") {
      if (!captchaOk) { setError("请完成滑块验证"); setLoading(false); return; }
      formData.append("confirmPassword", confirmPw);
      const result = await registerUser(formData);
      if (result?.error) { setError(result.error); setLoading(false); return; }
    }

    // Login captcha
    if (mode === "login") {
      if (!loginCaptcha.id) {
        const cap = await generateCaptcha();
        setLoginCaptcha({ id: cap.id, code: cap.code, input: "" });
        setLoading(false);
        return;
      }
      const valid = await validateCaptcha(loginCaptcha.id, loginCaptcha.input);
      if (!valid) {
        setError("验证码错误");
        const cap = await generateCaptcha();
        setLoginCaptcha({ id: cap.id, code: cap.code, input: "" });
        setLoading(false);
        return;
      }
    }

    // Sign in
    const login = formData.get("login") as string;
    const res = await signIn("credentials", { login, password, redirect: false });

    setLoading(false);

    if (res?.error) {
      setError("账号或密码错误");
      if (mode === "login") {
        const cap = await generateCaptcha();
        setLoginCaptcha({ id: cap.id, code: cap.code, input: "" });
      }
    } else if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function switchMode(m: "login" | "register") {
    setMode(m); setError(""); setConfirmPw(""); setCaptchaOk(false); setLoginCaptcha({ id: "", code: "", input: "" });
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-20">
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 neon-border mb-6">
            <Zap className="w-6 h-6 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
          <p className="text-sm text-muted-foreground">{mode === "login" ? "登录你的 Nexus 账号" : "加入 Nexus 资源分析平台"}</p>
        </div>

        <div className="relative rounded-2xl bg-surface border border-border/40 overflow-hidden">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="p-8">
            {/* Mode toggle */}
            <div className="flex rounded-xl bg-surface-hover p-1 mb-8">
              <button onClick={() => switchMode("login")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "login" ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}>登录</button>
              <button onClick={() => switchMode("register")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === "register" ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}>注册</button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mb-6 p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent">{error}</motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input name="name" type="text" placeholder="用户名" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input name="login" type="text" placeholder={mode === "login" ? "邮箱或用户名" : "邮箱地址"} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input name="password" type={showPw ? "text" : "password"} placeholder="密码" required minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === "register" && (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input name="confirmPassword" type="password" placeholder="确认密码" required minLength={6}
                    value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
                </div>
              )}

              {mode === "register" && (
                <div className="pt-2 flex justify-center">
                  <ClickCaptcha onVerify={(v) => setCaptchaOk(v)} />
                </div>
              )}

              {/* Login captcha */}
              {mode === "login" && (
                <div>
                  {loginCaptcha.id ? (
                    <div className="flex items-center gap-3">
                      <input name="captcha" type="text" placeholder="输入验证码" required maxLength={5}
                        value={loginCaptcha.input} onChange={(e) => setLoginCaptcha((p) => ({ ...p, input: e.target.value }))}
                        className="flex-1 px-4 py-3 rounded-xl bg-surface-hover border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all tracking-[0.3em] font-mono text-center uppercase" />
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-hover border border-border/30 select-none">
                        <span className="text-lg font-bold font-mono text-primary tracking-[0.25em]">{loginCaptcha.code}</span>
                        <button type="button" onClick={refreshCaptcha} className="text-muted-foreground hover:text-foreground transition-colors">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">点击登录按钮获取验证码</p>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="relative w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:neon-glow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                ) : (
                  <>{mode === "login" ? "登录" : "创建账号"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">Nexus Platform</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "login" ? "还没有账号？" : "已有账号？"}{" "}
              <button onClick={() => switchMode(mode === "login" ? "register" : "login")} className="text-primary hover:underline">
                {mode === "login" ? "立即注册" : "去登录"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
