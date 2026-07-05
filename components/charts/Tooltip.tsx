"use client";

import { createContext, useContext, useRef, useCallback, type ReactNode } from "react";

interface TooltipApi {
  show: (html: string, x: number, y: number) => void;
  hide: () => void;
}

const TooltipContext = createContext<TooltipApi | null>(null);

export function useTooltip(): TooltipApi {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("useTooltip must be used within a TooltipProvider");
  return ctx;
}

/** One shared tooltip element per dashboard, matching the original's single
 * global #tooltip div - charts imperatively set its position/content on
 * hover rather than each rendering their own. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement>(null);

  const show = useCallback((html: string, x: number, y: number) => {
    const el = elRef.current;
    if (!el) return;
    el.innerHTML = html;
    el.style.left = `${x + 14}px`;
    el.style.top = `${y + 10}px`;
    el.style.opacity = "1";
  }, []);

  const hide = useCallback(() => {
    if (elRef.current) elRef.current.style.opacity = "0";
  }, []);

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      <div className="tooltip" ref={elRef} />
    </TooltipContext.Provider>
  );
}
