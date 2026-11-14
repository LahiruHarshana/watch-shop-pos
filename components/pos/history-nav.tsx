"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SessionHistory = {
  canGoBack: boolean;
  canGoForward: boolean;
  addEventListener: (type: "currententrychange", listener: () => void) => void;
  removeEventListener: (type: "currententrychange", listener: () => void) => void;
};

function sessionHistory(): SessionHistory | null {
  const candidate = (window as Window & { navigation?: SessionHistory }).navigation;
  if (!candidate || typeof candidate.canGoBack !== "boolean") return null;
  return candidate;
}

export function HistoryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const url = query ? `${pathname}?${query}` : pathname;
  const stackRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const traverseRef = useRef(false);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  useEffect(() => {
    const navigation = sessionHistory();
    if (!navigation) return;
    let pending = 0;
    const sync = () => {
      window.clearTimeout(pending);
      pending = window.setTimeout(() => {
        setCanBack(navigation.canGoBack);
        setCanForward(navigation.canGoForward);
      }, 0);
    };
    sync();
    navigation.addEventListener("currententrychange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.clearTimeout(pending);
      navigation.removeEventListener("currententrychange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (sessionHistory()) return;
    const onPop = () => {
      traverseRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (sessionHistory()) return;
    const stack = stackRef.current;
    const index = indexRef.current;
    const traversed = traverseRef.current;
    traverseRef.current = false;
    if (stack.length === 0) {
      stackRef.current = [url];
      indexRef.current = 0;
      setCanBack(false);
      setCanForward(false);
      return;
    }
    if (stack[index] === url) return;
    if (traversed) {
      if (index > 0 && stack[index - 1] === url) indexRef.current = index - 1;
      else if (index < stack.length - 1 && stack[index + 1] === url) indexRef.current = index + 1;
      else {
        const found = stack.lastIndexOf(url);
        if (found >= 0) indexRef.current = found;
        else {
          stack.push(url);
          indexRef.current = stack.length - 1;
        }
      }
    } else {
      const next = stack.slice(0, index + 1);
      next.push(url);
      stackRef.current = next;
      indexRef.current = next.length - 1;
    }
    setCanBack(indexRef.current > 0);
    setCanForward(indexRef.current < stackRef.current.length - 1);
  }, [url]);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label="Back"
        title="Back"
        disabled={!canBack}
        onClick={() => {
          traverseRef.current = true;
          router.back();
        }}
        className="flex size-11 items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground shadow-[var(--shadow-surface)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Forward"
        title="Forward"
        disabled={!canForward}
        onClick={() => {
          traverseRef.current = true;
          router.forward();
        }}
        className="flex size-11 items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground shadow-[var(--shadow-surface)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
