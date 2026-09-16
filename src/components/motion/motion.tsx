import type { ReactNode } from "react";
import { motion, useReducedMotion, type MotionStyle, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Page mount: fade in with a 6px upward drift. */
export function PageFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } },
};

/** Staggered container for card grids / lists. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul";
}) {
  const reduce = useReducedMotion();
  const Comp = as === "ul" ? motion.ul : motion.div;
  return (
    <Comp
      className={className}
      variants={groupVariants}
      initial={reduce ? false : "hidden"}
      animate="show"
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  style?: MotionStyle;
}) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp className={className} variants={itemVariants} {...(style ? { style } : {})}>
      {children}
    </Comp>
  );
}

/** Shimmering skeleton placeholder. */
export function ShimmerBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md bg-muted", className)} />;
}
