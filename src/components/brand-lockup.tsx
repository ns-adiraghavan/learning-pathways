import logoLight from "@/assets/ns-logo.png.asset.json";
import logoDark from "@/assets/ns-logo-white.png.asset.json";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  /** Hide the divider + wordmark (collapsed sidebar). */
  markOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LOGO_H = { sm: "h-4", md: "h-5", lg: "h-6", xl: "h-7" } as const;
const TEXT = {
  sm: "text-[17px]",
  md: "text-[20px]",
  lg: "text-[26px]",
  xl: "text-[38px]",
} as const;
const DIV_H = { sm: "h-4", md: "h-5", lg: "h-6", xl: "h-8" } as const;

/** The Netscribes mark + the "lessons" wordmark, read as one unit. */
export function BrandLockup({ markOnly, size = "md", className }: BrandLockupProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logoLight.url}
        alt="Netscribes"
        className={cn(LOGO_H[size], "w-auto shrink-0 dark:hidden")}
      />
      <img
        src={logoDark.url}
        alt="Netscribes"
        className={cn("hidden w-auto shrink-0 dark:block", LOGO_H[size])}
      />
      {!markOnly && (
        <>
          <span aria-hidden className={cn("w-px shrink-0 bg-border", DIV_H[size])} />
          <Wordmark size={size} />
        </>
      )}
    </span>
  );
}

/** Standalone "lessons" wordmark — display type, blue body, teal tail. */
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
        "font-display leading-none font-semibold tracking-[-0.03em] lowercase",
        TEXT[size],
        className,
      )}
    >
      <span className="text-brand-blue">lesso</span>
      <span className="text-primary">ns</span>
    </span>
  );
}
