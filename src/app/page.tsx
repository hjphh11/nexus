"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  MessageSquare,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Activity,
  Cpu,
  Radio,
} from "lucide-react";
import { HolographicTilt } from "@/components/effects/holographic-tilt";
import { TerminalPreview } from "@/components/effects/terminal-preview";
import { CountUp } from "@/components/effects/count-up";
import { GlitchText } from "@/components/effects/glitch-text";
import { getPublicStats } from "@/actions/stats";
// Lazy load heavy 3D/Canvas components
const WireframeSphere = dynamic(() => import("@/components/effects/wireframe-sphere").then((m) => ({ default: m.WireframeSphere })), { ssr: false });
const HexagonGrid = dynamic(() => import("@/components/effects/hexagon-grid").then((m) => ({ default: m.HexagonGrid })), { ssr: false });
const CircuitLines = dynamic(() => import("@/components/effects/circuit-lines").then((m) => ({ default: m.CircuitLines })), { ssr: false });

const features = [
  {
    icon: Database,
    title: "智能资源管理",
    description: "多类型资源智能分类、全文检索、自定义元数据标注体系",
    color: "primary" as const,
  },
  {
    icon: MessageSquare,
    title: "深度技术论坛",
    description: "板块化技术讨论、Markdown 富文本、嵌套回复与知识沉淀",
    color: "secondary" as const,
  },
  {
    icon: BarChart3,
    title: "多维数据分析",
    description: "实时访问统计、趋势预测、用户行为热力图可视化分析",
    color: "accent" as const,
  },
  {
    icon: Zap,
    title: "实时同步协作",
    description: "WebSocket 实时推送、多人协同标注、版本历史回溯",
    color: "primary" as const,
  },
  {
    icon: Shield,
    title: "企业级安全",
    description: "AES-256 加密存储、RBAC 权限管控、全链路审计日志",
    color: "secondary" as const,
  },
  {
    icon: Globe,
    title: "开放 API 生态",
    description: "RESTful + GraphQL 双接口、Webhook 事件、SDK 多语言支持",
    color: "accent" as const,
  },
];

const tickerItems = [
  "SYSTEM ONLINE",
  "NODES: 2,847",
  "LATENCY: 24ms",
  "UPTIME: 99.99%",
  "THROUGHPUT: 12.4K/s",
  "ENCRYPTION: AES-256-GCM",
  "CDN: GLOBAL",
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const [dispersion, setDispersion] = useState(0);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [publicStats, setPublicStats] = useState({ users: 0, resources: 0, posts: 0, todayActive: 0 });

  useEffect(() => { getPublicStats().then(setPublicStats); }, []);
  const [, forceRender] = useState(0);

  // Track scroll → sphere dispersion
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const heroH = rect.height;
      const progress = Math.max(0, Math.min(1, (heroH * 0.7 - rect.bottom + rect.height * 0.3) / (heroH * 0.7)));
      setDispersion(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track mouse in hero → sphere follows cursor
  const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Check if mouse is inside the sphere's visual circle
  function isInsideSphere(e: WheelEvent): boolean {
    if (!sphereRef.current) return false;
    const rect = sphereRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.28 * zoomRef.current;
    return Math.hypot(e.clientX - cx, e.clientY - cy) <= radius;
  }

  // Native wheel listener — only blocks scroll when cursor is inside the sphere circle
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isInsideSphere(e)) return;
      e.preventDefault();
      const next = Math.max(0.4, Math.min(2.5, zoomRef.current - e.deltaY * 0.001));
      zoomRef.current = next;
      forceRender((n) => n + 1);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="flex flex-col noise-overlay">
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION - 3D Sphere + Glitch Title
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background layers */}
        <HexagonGrid />
        <CircuitLines />

        {/* 3D Wireframe Sphere — zoom only when cursor is inside the sphere circle */}
        <div ref={sphereRef} className="absolute inset-0 z-0">
          <WireframeSphere dispersion={dispersion} mouseX={mouse.x} mouseY={mouse.y} zoom={zoomRef.current} />
        </div>

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-line" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
          {/* System badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass border border-primary/20 mb-10"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-glow-pulse absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-xs font-mono text-primary/80 tracking-widest">
              NEXUS // SYSTEM ACTIVE
            </span>
          </motion.div>

          {/* Main Title with Glitch */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-8xl font-heading font-bold tracking-tight leading-none">
              <GlitchText
                text="NEXUS"
                as="span"
                glitchOnHover
                className="text-primary text-glow cursor-default"
              />
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            突破数据边界
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm md:text-base text-muted-foreground/70 max-w-xl mx-auto mb-12"
          >
            AI 驱动的资源分析引擎 &middot; 实时协作讨论 &middot; 多维数据可视化
          </motion.p>

          {/* CTA with energy rings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20"
          >
            {/* Primary CTA with energy ring */}
            <div className="relative">
              <Link
                href="/forum"
                className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:neon-glow transition-all duration-300 group"
              >
                <MessageSquare className="w-4 h-4" />
                技术分享
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* Energy ring pulses */}
              <span className="absolute inset-0 rounded-xl bg-primary/20 animate-energy-pulse pointer-events-none" />
              <span
                className="absolute inset-0 rounded-xl bg-primary/10 animate-energy-pulse pointer-events-none"
                style={{ animationDelay: "0.5s" }}
              />
            </div>

            <Link
              href="/resources"
              className="px-8 py-3.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-surface-hover transition-all duration-300 text-sm font-medium"
            >
              资源分享
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-mono text-muted-foreground/50 tracking-widest">
              SCROLL
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-4 h-7 rounded-full border border-primary/20 flex items-start justify-center p-1"
            >
              <motion.div className="w-1 h-1.5 rounded-full bg-primary/60" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE TICKER BAR
          ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 border-y border-border/30 bg-surface/50 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-3">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-8">
              <Activity className="w-3 h-3 text-primary/60" />
              <span className="text-xs font-mono text-muted-foreground">{item}</span>
              <span className="w-1 h-1 rounded-full bg-primary/30" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          STATS DASHBOARD
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-sm font-mono text-primary/60 tracking-widest mb-4">
            // LIVE METRICS
          </h2>
          <p className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            平台实时<span className="text-primary">数据</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "在线节点", value: publicStats.users, icon: Cpu, suffix: "" },
            { label: "资源总量", value: publicStats.resources, icon: Database, suffix: "" },
            { label: "论坛帖子", value: publicStats.posts, icon: MessageSquare, suffix: "" },
            { label: "今日活跃", value: publicStats.todayActive, icon: Radio, suffix: "" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <HolographicTilt className="h-full">
                <div className="relative p-6 rounded-xl bg-surface border border-border/40 overflow-hidden h-full">
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 grid-bg opacity-30" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-5 h-5 text-primary/60" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold font-mono text-primary text-glow mb-1">
                      <CountUp end={stat.value} duration={2000} />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </HolographicTilt>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TERMINAL + CAPABILITIES
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Terminal Window */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-xl border border-border/40 overflow-hidden bg-[#0a0a0f]/90">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface/80 border-b border-border/20">
                <span className="w-3 h-3 rounded-full bg-accent/80" />
                <span className="w-3 h-3 rounded-full bg-warning/80" />
                <span className="w-3 h-3 rounded-full bg-success/80" />
                <span className="ml-3 text-[10px] font-mono text-muted-foreground">
                  nexus@core:~/
                </span>
              </div>
              {/* Terminal body */}
              <div className="p-5">
                <TerminalPreview />
              </div>
            </div>
          </motion.div>

          {/* Capabilities text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-sm font-mono text-primary/60 tracking-widest mb-4">
              // WHY NEXUS
            </h2>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6 leading-tight">
              为<span className="text-primary">下一代</span>数据工作者打造
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                在数据爆炸的时代，传统的资源管理工具已无法满足复杂分析需求。
                Nexus 融合 AI 分析引擎、实时协作与多维可视化，
                让每一个数据点都产生价值。
              </p>
              <p>
                从资源上传到深度分析，从技术讨论到知识沉淀，
                Nexus 构建了一个完整的资源生命周期管理闭环。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["AI 分析引擎", "实时协作", "全文检索", "API 开放", "端到端加密", "全球 CDN"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-xs font-mono text-primary/80"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURE GRID
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-sm font-mono text-primary/60 tracking-widest mb-4">
            // CAPABILITIES
          </h2>
          <p className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            六大<span className="text-primary">核心</span>模块
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <HolographicTilt
                glareColor={
                  feature.color === "primary"
                    ? "rgba(0, 240, 255, 0.12)"
                    : feature.color === "secondary"
                      ? "rgba(124, 58, 237, 0.12)"
                      : "rgba(244, 63, 94, 0.12)"
                }
                className="h-full"
              >
                <div className="relative p-6 rounded-xl bg-surface border border-border/40 h-full overflow-hidden">
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-3 right-3 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${
                        feature.color === "primary"
                          ? "rgba(0,240,255,0.4)"
                          : feature.color === "secondary"
                            ? "rgba(124,58,237,0.4)"
                            : "rgba(244,63,94,0.4)"
                      }, transparent)`,
                    }}
                  />

                  <div className="relative z-10 flex flex-col gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-${feature.color}/10 border border-${feature.color}/20 flex items-center justify-center`}
                    >
                      <feature.icon
                        className={`w-5 h-5 text-${feature.color}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </HolographicTilt>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative rounded-3xl border border-border/30 bg-surface/60 p-16 md:p-20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-6">
                准备好<span className="text-primary text-glow">启航</span>了吗？
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-10">
                加入数千名数据工作者，在 Nexus 平台上发现、分析、讨论。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:neon-glow transition-all duration-300"
                >
                  立即注册
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300 text-sm font-medium"
                >
                  浏览资源库
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Marquee animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
