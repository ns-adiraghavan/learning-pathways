import { cn } from "@/lib/utils";

const logoLight = "/netscribes-logo.png";
const logoDark = "/netscribes-logo-white.png";
const mark = "/favicon.png";

interface BrandLockupProps {
  /** Hide the divider + wordmark (collapsed sidebar). */
  markOnly?: boolean;
  /** Compact lockup: square mark + "NS Lessons", no wide logo (fits the sidebar). */
  compact?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LOGO_H = { sm: "h-4", md: "h-5", lg: "h-6", xl: "h-7" } as const;
const MARK_SZ = { sm: "size-6", md: "size-7", lg: "size-8", xl: "size-9" } as const;
const TEXT = {
  sm: "text-[17px]",
  md: "text-[20px]",
  lg: "text-[26px]",
  xl: "text-[38px]",
} as const;
const DIV_H = { sm: "h-4", md: "h-5", lg: "h-6", xl: "h-8" } as const;

/** The Netscribes mark + the "NS Lessons" wordmark, read as one unit. */
export function BrandLockup({ markOnly, compact, size = "md", className }: BrandLockupProps) {
  // Collapsed: show the square favicon mark (the wide logo cropped to a strip
  // reads as a sliver). Expanded: the wide wordmark logo + "NS Lessons".
  if (markOnly) {
    return (
      <span className={cn("flex items-center justify-center", className)}>
        <img
          src={mark}
          alt="NS Lessons"
          className={cn(MARK_SZ[size], "shrink-0 rounded-md object-contain")}
        />
      </span>
    );
  }

  // Compact: square mark + wordmark, no wide logo — fits a narrow sidebar.
  if (compact) {
    return (
      <span className={cn("flex min-w-0 items-center gap-2", className)}>
        <img
          src={mark}
          alt=""
          className={cn(MARK_SZ[size], "shrink-0 rounded-md object-contain")}
        />
        <Wordmark size={size} />
      </span>
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logoLight}
        alt="Netscribes"
        className={cn(LOGO_H[size], "w-auto shrink-0 dark:hidden")}
      />
      <img
        src={logoDark}
        alt="Netscribes"
        className={cn("hidden w-auto shrink-0 dark:block", LOGO_H[size])}
      />
      <span aria-hidden className={cn("w-px shrink-0 bg-border", DIV_H[size])} />
      <Wordmark size={size} />
    </span>
  );
}

/** Standalone "NS Lessons" wordmark — display type, teal NS + blue Lessons. */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-display leading-none whitespace-nowrap font-semibold tracking-[-0.03em]",
        TEXT[size],
        className,
      )}
    >
      <span className="text-primary">NS</span> <span className="text-brand-blue">Lessons</span>
    </span>
  );
}
