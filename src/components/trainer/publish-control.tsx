import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { setPublishState } from "@/data/repositories";
import type { PublishState } from "@/data/types";
import { Button } from "@/components/ui/button";

const KIND_LABEL = {
  program: "Program",
  skill: "Skill",
  module: "Module",
} as const;

/**
 * Publish / unpublish toggle for a program, skill or module. Optimistic against
 * the in-session publish store; invalidates the given query keys on success.
 */
export function PublishControl({
  id,
  state,
  kind,
  invalidateKeys = [],
  size = "sm",
}: {
  id: string;
  state: PublishState;
  kind: keyof typeof KIND_LABEL;
  invalidateKeys?: (readonly unknown[])[];
  size?: "sm" | "icon";
}) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const published = state === "published";

  const toggle = async () => {
    setPending(true);
    const next: PublishState = published ? "draft" : "published";
    await setPublishState(id, next);
    await Promise.all(
      invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
    );
    setPending(false);
    toast.success(
      next === "published"
        ? `${KIND_LABEL[kind]} published`
        : `${KIND_LABEL[kind]} unpublished — hidden from learners`,
    );
  };

  return (
    <Button
      size={size}
      variant={published ? "outline" : "default"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      aria-label={published ? `Unpublish ${kind}` : `Publish ${kind}`}
    >
      {published ? (
        <>
          <EyeOff className="size-4" strokeWidth={1.75} />
          {size === "sm" && "Unpublish"}
        </>
      ) : (
        <>
          <Eye className="size-4" strokeWidth={1.75} />
          {size === "sm" && "Publish"}
        </>
      )}
    </Button>
  );
}
