import { useEffect, useRef } from "react";

/**
 * Subtle Matrix-style falling characters background.
 * Uses semantic neon colors from the design system.
 * Respects prefers-reduced-motion.
 */
export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Vivid neon green — classic Matrix look
    const green = "135 100% 55%";
    const greenBright = "120 100% 70%";

    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let tints: number[] = []; // 0 = green, 1 = bright green leader

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -50);
      speeds = Array.from({ length: columns }, () => 0.3 + Math.random() * 0.5);
      tints = Array.from({ length: columns }, () => (Math.random() < 0.15 ? 1 : 0));
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    const targetFps = 24;
    const interval = 1000 / targetFps;

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Trail fade — keep low alpha for subtle, ghosted effect
      ctx.fillStyle = "hsla(220, 60%, 5%, 0.08)";
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px "Space Grotesk", monospace`;

      for (let i = 0; i < columns; i++) {
        const ch = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const color = tints[i] === 1 ? purple : cyan;
        // Bright leading char
        ctx.shadowColor = `hsl(${color})`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsla(${color}, 0.95)`;
        ctx.fillText(ch, x, y);

        // Reset when off-screen
        if (y > h && Math.random() > 0.975) {
          drops[i] = Math.random() * -20;
          tints[i] = Math.random() < 0.15 ? 1 : 0;
        }
        drops[i] += speeds[i];
      }
      ctx.shadowBlur = 0;
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0, opacity: 0.85 }}
    />
  );
}
