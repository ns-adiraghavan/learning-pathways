import { useCallback, useEffect, useState } from "react";

export type ViewMode = "learner" | "trainer" | "admin";

const KEY = "lessons-view-mode";
const EVENT = "lessons-view-mode-change";

function read(): ViewMode {
  if (typeof window === "undefined") return "learner";
  const stored = window.localStorage.getItem(KEY);
  return stored === "trainer" || stored === "admin" ? stored : "learner";
}

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>("learner");

  useEffect(() => {
    setMode(read());
    const sync = () => setMode(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setViewMode = useCallback((next: ViewMode) => {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { mode, setViewMode };
}
