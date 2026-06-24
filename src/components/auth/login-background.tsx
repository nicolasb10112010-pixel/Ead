"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo animado da tela de login: partículas azuis/ciano em canvas leve.
 * - Movimento lento e elegante; conexões bem sutis (só desktop).
 * - O mouse afasta de leve as partículas próximas + um glow radial segue o cursor.
 * - Respeita prefers-reduced-motion (desenha um único quadro estático).
 * - Mobile: menos partículas e sem linhas/glow.
 * - pointer-events: none → nunca atrapalha cliques no card de login.
 */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let raf = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let particles: P[] = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      const count = isMobile ? 26 : Math.min(80, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.6 + 0.6,
        a: Math.random() * 0.5 + 0.2,
      }));
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Reentra pelo lado oposto (efeito infinito).
        if (p.x < 0) p.x = w;
        else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        else if (p.y > h) p.y = 0;

        // Afastamento suave do cursor.
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const d = Math.sqrt(d2) || 1;
          const f = ((120 - d) / 120) * 0.5;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(56, 189, 248, ${p.a})`;
        ctx!.fill();
      }

      // Conexões sutis (apenas desktop).
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 9000) {
              const alpha = (1 - d2 / 9000) * 0.12;
              ctx!.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx!.lineWidth = 0.5;
              ctx!.beginPath();
              ctx!.moveTo(a.x, a.y);
              ctx!.lineTo(b.x, b.y);
              ctx!.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    init();
    if (reduced) {
      // Um quadro estático, sem animação.
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.a})`;
        ctx.fill();
      }
    } else {
      frame();
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (glowRef.current && !isMobile) {
        glowRef.current.style.transform = `translate(${e.clientX - 250}px, ${
          e.clientY - 250
        }px)`;
        glowRef.current.style.opacity = "1";
      }
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      if (glowRef.current) glowRef.current.style.opacity = "0";
    }
    function onResize() {
      resize();
      init();
    }

    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseout", onLeave);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Camada 1 — degradê escuro premium */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_70%_-10%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(900px_600px_at_-10%_30%,rgba(124,92,255,0.10),transparent_55%)]" />
      {/* Camada 2 — partículas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Camada 3 — glow radial que segue o mouse */}
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12), transparent 60%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
