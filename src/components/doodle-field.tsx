import { motion, useReducedMotion } from "framer-motion";

type Doodle = {
  kind: "ring" | "squiggle" | "cross" | "arc" | "dots" | "triangle";
  size: number;
  top: string;
  left: string;
  tint: string;
  rotate: number;
  delay: number;
  duration: number;
  drift: number;
};

const SHAPES: Record<Doodle["kind"], React.ReactNode> = {
  ring: <circle cx="32" cy="32" r="24" />,
  squiggle: <path d="M4 40c8-18 16 14 24-4s16 12 32-8" />,
  cross: <path d="M32 10v44M10 32h44" />,
  arc: <path d="M6 48a30 30 0 0 1 52 0" />,
  dots: (
    <>
      <circle cx="16" cy="20" r="2.5" />
      <circle cx="34" cy="20" r="2.5" />
      <circle cx="52" cy="20" r="2.5" />
      <circle cx="16" cy="42" r="2.5" />
      <circle cx="34" cy="42" r="2.5" />
      <circle cx="52" cy="42" r="2.5" />
    </>
  ),
  triangle: <path d="M32 10 56 52H8Z" />,
};

const LOGIN_DOODLES: Doodle[] = [
  { kind: "ring", size: 120, top: "10%", left: "8%", tint: "var(--brand-blue)", rotate: 0, delay: 0, duration: 16, drift: 16 },
  { kind: "squiggle", size: 150, top: "26%", left: "18%", tint: "var(--color-primary)", rotate: -8, delay: 1.1, duration: 14, drift: -14 },
  { kind: "cross", size: 54, top: "16%", left: "42%", tint: "var(--brand-blue)", rotate: 12, delay: 0.5, duration: 12, drift: 12 },
  { kind: "arc", size: 180, top: "62%", left: "6%", tint: "var(--brand-blue)", rotate: 6, delay: 0.8, duration: 18, drift: 20 },
  { kind: "dots", size: 96, top: "78%", left: "30%", tint: "var(--color-primary)", rotate: 0, delay: 1.8, duration: 15, drift: -12 },
  { kind: "triangle", size: 110, top: "8%", left: "76%", tint: "var(--color-primary)", rotate: -14, delay: 0.4, duration: 17, drift: 18 },
  { kind: "ring", size: 200, top: "48%", left: "80%", tint: "var(--brand-blue)", rotate: 0, delay: 1.4, duration: 20, drift: -22 },
  { kind: "squiggle", size: 130, top: "84%", left: "68%", tint: "var(--brand-blue)", rotate: 4, delay: 2.2, duration: 13, drift: 14 },
  { kind: "cross", size: 40, top: "40%", left: "58%", tint: "var(--color-primary)", rotate: -6, delay: 1, duration: 11, drift: -10 },
];

const PANEL_DOODLES: Doodle[] = [
  { kind: "ring", size: 92, top: "-18%", left: "72%", tint: "var(--brand-blue)", rotate: 0, delay: 0, duration: 18, drift: 10 },
  { kind: "squiggle", size: 120, top: "46%", left: "84%", tint: "var(--color-primary)", rotate: -6, delay: 1.2, duration: 16, drift: -12 },
  { kind: "cross", size: 34, top: "18%", left: "62%", tint: "var(--brand-blue)", rotate: 10, delay: 0.7, duration: 14, drift: 8 },
  { kind: "dots", size: 74, top: "52%", left: "56%", tint: "var(--brand-blue)", rotate: 0, delay: 1.9, duration: 17, drift: -8 },
];

function DoodleLayer({ items, opacity }: { items: Doodle[]; opacity: number }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((d, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 64 64"
          fill="none"
          className="absolute"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            opacity,
            color: d.tint,
            rotate: `${d.rotate}deg`,
          }}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={
            reduce
              ? { y: 0, x: 0 }
              : { y: [0, d.drift, 0], x: [0, d.drift / -2, 0] }
          }
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {SHAPES[d.kind]}
        </motion.svg>
      ))}
    </div>
  );
}

/** Full-screen doodle backdrop for the sign-in page. Purely decorative. */
export function DoodleField() {
  return (
    <>
      <DoodleLayer items={LOGIN_DOODLES} opacity={0.28} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/70"
      />
    </>
  );
}

/** Small doodle wash for page headers and panels. Purely decorative. */
export function DoodlePanel() {
  return <DoodleLayer items={PANEL_DOODLES} opacity={0.22} />;
}
