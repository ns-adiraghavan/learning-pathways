import { motion, useReducedMotion } from "framer-motion";

type Blob = {
  size: number;
  top: string;
  left: string;
  tint: string;
  opacity: number;
  delay: number;
  duration: number;
  drift: number;
};

const BLOBS: Blob[] = [
  { size: 190, top: "8%", left: "6%", tint: "var(--brand-blue)", opacity: 0.16, delay: 0, duration: 15, drift: 22 },
  { size: 90, top: "26%", left: "20%", tint: "var(--color-primary)", opacity: 0.18, delay: 1.2, duration: 12, drift: -16 },
  { size: 260, top: "48%", left: "-4%", tint: "var(--brand-blue)", opacity: 0.1, delay: 0.6, duration: 18, drift: 26 },
  { size: 120, top: "70%", left: "26%", tint: "var(--color-primary)", opacity: 0.12, delay: 2, duration: 14, drift: -20 },
  { size: 70, top: "14%", left: "44%", tint: "var(--brand-blue)", opacity: 0.2, delay: 0.4, duration: 11, drift: 18 },
  { size: 320, top: "-8%", left: "68%", tint: "var(--brand-blue)", opacity: 0.14, delay: 1, duration: 20, drift: -28 },
  { size: 140, top: "56%", left: "78%", tint: "var(--color-primary)", opacity: 0.14, delay: 1.8, duration: 16, drift: 24 },
  { size: 60, top: "82%", left: "62%", tint: "var(--brand-blue)", opacity: 0.18, delay: 2.4, duration: 13, drift: -14 },
  { size: 44, top: "38%", left: "56%", tint: "var(--color-primary)", opacity: 0.22, delay: 0.9, duration: 10, drift: 16 },
];

/** Slow-drifting bubble doodles for the sign-in backdrop. Purely decorative. */
export function DoodleField() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BLOBS.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            opacity: b.opacity,
            background: `radial-gradient(circle at 32% 28%, color-mix(in oklab, ${b.tint} 85%, white), ${b.tint})`,
          }}
          animate={
            reduce
              ? { y: 0, x: 0, scale: 1 }
              : { y: [0, b.drift, 0], x: [0, b.drift / -2, 0], scale: [1, 1.05, 1] }
          }
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/70" />
    </div>
  );
}
