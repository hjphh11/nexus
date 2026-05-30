"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { SearchOverlay } from "./search-overlay";
import { ParticleBackground } from "@/components/effects/particle-background";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Global particle background */}
      <ParticleBackground />

      {/* Navbar — hide on admin (admin has own header) */}
      {!isAdmin && <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}

      {/* Global search overlay */}
      <SearchOverlay />

      {/* Sidebar — hide on admin (admin has own sidebar) */}
      {!isAdmin && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className={`flex-1 min-h-0 ${isAdmin ? "" : "pt-16 lg:pl-[60px]"}`}>{children}</main>

      {/* Footer — hide on admin */}
      {!isAdmin && (
        <footer className="relative z-10 border-t border-border/50 py-8 lg:pl-[60px]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Nexus &copy; {new Date().getFullYear()} &mdash; 资源分析与讨论平台</p>
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs text-primary/60">STATUS: ONLINE</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-glow-pulse" />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
