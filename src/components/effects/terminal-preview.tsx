"use client";

import { useEffect, useState } from "react";

const lines = [
  "> SYSTEM BOOT SEQUENCE INITIATED...",
  "> LOADING NEXUS CORE v1.0.3",
  "> INITIALIZING PARTICLE ENGINE... OK",
  "> CONNECTING TO RESOURCE GRID... CONNECTED",
  '> ACTIVE NODES: 2,847 | LATENCY: 24ms',
  "> RESOURCE INDEX: 12,403 entries",
  "> FORUM THREADS ACTIVE: 8,521",
  '> SECURITY LAYER: ENCRYPTED [AES-256-GCM]',
  "> ANALYTICS ENGINE: ONLINE",
  "> REAL-TIME SYNC: ENABLED",
  '> SYSTEM STATUS: OPERATIONAL',
  '> _',
];

export function TerminalPreview() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let currentLine = "";

    const typeInterval = setInterval(() => {
      if (lineIndex >= lines.length) {
        clearInterval(typeInterval);
        return;
      }

      if (charIndex < lines[lineIndex].length) {
        currentLine += lines[lineIndex][charIndex];
        setVisibleLines((prev) => {
          const next = [...prev];
          next[lineIndex] = currentLine;
          return next;
        });
        charIndex++;
      } else {
        lineIndex++;
        charIndex = 0;
        currentLine = "";
      }
    }, 30);

    // Blinking cursor
    const cursorInterval = setInterval(() => {
      setCursor((c) => !c);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="font-mono text-xs md:text-sm leading-relaxed">
      {visibleLines.map((line, i) => (
        <div key={i} className="flex">
          <span className="text-primary/60 mr-2 select-none">$</span>
          <span
            className={
              line.includes("OK") || line.includes("ONLINE") || line.includes("CONNECTED") || line.includes("ENABLED")
                ? "text-success"
                : line.includes("OPERATIONAL")
                  ? "text-primary"
                  : "text-muted-foreground"
            }
          >
            {line}
          </span>
        </div>
      ))}
      {visibleLines.length < lines.length && (
        <div className="flex">
          <span className="text-primary/60 mr-2 select-none">$</span>
          <span
            className={`inline-block w-2 h-4 bg-primary/80 ${
              cursor ? "opacity-100" : "opacity-0"
            } transition-opacity duration-75`}
          />
        </div>
      )}
    </div>
  );
}
