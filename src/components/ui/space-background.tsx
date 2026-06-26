import { useEffect, useRef, type RefObject } from 'react';

interface Particle {
  color: string;
  radius: number;
  x: number;
  y: number;
  ring: number;
  move: number;
  random: number;
}

interface SpaceBackgroundProps {
  particleCount?: number;
  particleColor?: string;
  /** Orbit (settle) radius as a fraction of the reference inscribed radius. */
  ringRatio?: number;
  /** Element to center the swirl on (and derive the orbit radius from). */
  centerRef?: RefObject<HTMLElement | null>;
  /** 0..1 — when set, leaves radial motion-blur trails (lower = longer trails). */
  trailAlpha?: number;
  className?: string;
}

export function SpaceBackground({
  particleCount = 450,
  particleColor = 'rgba(255,255,255,0.85)',
  ringRatio = 1,
  centerRef,
  trailAlpha,
  className = '',
}: SpaceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = {
      particles: [] as Particle[],
      r: 120,
      maxR: 360,
      counter: 0,
    };

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.clientWidth || 1;
      const h = rect.height || canvas.clientHeight || 1;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));

      // Center the swirl on the globe (if provided), else on the canvas.
      let cx = w / 2;
      let cy = h / 2;
      let refR = Math.min(w, h) / 2;
      const el = centerRef?.current;
      if (el) {
        const cr = el.getBoundingClientRect();
        cx = cr.left + cr.width / 2 - rect.left;
        cy = cr.top + cr.height / 2 - rect.top;
        refR = Math.min(cr.width, cr.height) / 2;
      }

      state.r = refR * ringRatio;
      // Spawn out to the farthest screen corner so particles enter from every edge.
      state.maxR = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(w - cx, cy),
        Math.hypot(cx, h - cy),
        Math.hypot(w - cx, h - cy)
      );
      ctx.setTransform(dpr, 0, 0, -dpr, cx * dpr, cy * dpr);
    };
    setupCanvas();

    // Bias spawns toward the outer edge so they read as coming from the screen edges.
    const spawnRing = () => state.r + (state.maxR - state.r) * Math.sqrt(Math.random());

    const createParticle = () => {
      const ring = spawnRing();
      const random = Math.random() * 7;
      state.particles.push({
        color: particleColor,
        radius: Math.random() * 5,
        x: Math.cos(random + Math.PI) * ring,
        y: Math.sin(random + Math.PI) * ring,
        ring,
        move: (Math.random() * 4 + 1) / 500,
        random,
      });
    };
    for (let i = 0; i < particleCount; i++) createParticle();

    const moveParticle = (p: Particle) => {
      p.ring = Math.max(p.ring - 1, state.r);
      p.random += p.move;
      p.x = Math.cos(p.random + Math.PI) * p.ring;
      p.y = Math.sin(p.random + Math.PI) * p.ring;
    };

    const resetParticle = (p: Particle) => {
      p.ring = spawnRing();
      p.radius = Math.random() * 5;
    };

    const disappear = (p: Particle) => {
      // Travel inward at full size; only fade once settled on the globe's rim,
      // then respawn back out at a screen edge.
      if (p.ring <= state.r + 0.5) {
        if (p.radius < 0.8) resetParticle(p);
        else p.radius *= 0.95;
      }
    };

    const draw = (p: Particle) => {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      if (trailAlpha && trailAlpha > 0) {
        // Fade prior frames (instead of clearing) so moving particles leave
        // soft radial trails. destination-out keeps the canvas transparent.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);
      }
      if (state.counter < state.particles.length) state.counter++;
      for (let i = 0; i < state.counter; i++) {
        disappear(state.particles[i]);
        moveParticle(state.particles[i]);
        draw(state.particles[i]);
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(canvas);
    if (centerRef?.current) ro.observe(centerRef.current);
    window.addEventListener('resize', setupCanvas);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setupCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, particleColor, ringRatio, centerRef, trailAlpha]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    />
  );
}
