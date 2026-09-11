import logoLight from "@/assets/ns-logo.png.asset.json";
import logoDark from "@/assets/ns-logo-white.png.asset.json";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  /** Hide the divider + wordmark (collapsed sidebar). */
  markOnly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function BrandLockup({ markOnly, size = "md", className }: BrandLockupProps) {
  const logoH = size === "sm" ? "h-4" : "h-5";
  const textSize = size === "sm" ? "text-[13px]" : "text-[15px]";
  const divH = size === "sm" ? "h-3.5" : "h-4";

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logoLight.url}
        alt="Netscribes"
        className={cn(logoH, "w-auto shrink-0 translate-y-[0.5px] dark:hidden")}
      />
      <img
        src={logoDark.url}
        alt="Netscribes"
        className={cn("hidden w-auto shrink-0 translate-y-[0.5px] dark:block", logoH)}
      />
      {!markOnly && (
        <>
          <span
            aria-hidden
            className={cn("w-px shrink-0 bg-border", divH)}
          />
          <span
            className={cn(
              "truncate leading-none font-[510] tracking-tight text-foreground",
              textSize,
            )}
          >
            Lesson<span className="text-primary">s</span>
          </span>
        </>
      )}
    </span>
  );
}
