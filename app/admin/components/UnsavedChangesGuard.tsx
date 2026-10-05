"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

type Registry = { register: (form: HTMLFormElement, dirty: () => boolean) => () => void };
const Context = createContext<Registry>({ register: () => () => {} });
export const useUnsavedChanges = () => useContext(Context);

export default function UnsavedChangesGuard({ children }: { children: ReactNode }) {
  const forms = useRef(new Map<HTMLFormElement, () => boolean>());
  const registry = useMemo(() => ({ register(form: HTMLFormElement, dirty: () => boolean) {
    forms.current.set(form, dirty);
    return () => { forms.current.delete(form); };
  } }), []);

  useEffect(() => {
    const dirty = () => [...forms.current.values()].some((check) => check());
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty()) { event.preventDefault(); event.returnValue = ""; }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, location.href);
      if (!["http:", "https:"].includes(destination.protocol)) return;
      if (destination.origin === location.origin && destination.pathname === location.pathname && destination.search === location.search) return;
      if (dirty()) {
        if (!confirm("You have unsaved changes. Leave this page and discard them?")) {
          event.preventDefault();
          event.stopImmediatePropagation();
        } else {
          // Use a full navigation so one confirmation covers both Next links and ordinary links.
          event.preventDefault();
          event.stopImmediatePropagation();
          window.removeEventListener("beforeunload", beforeUnload);
          location.assign(destination.href);
        }
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return <Context.Provider value={registry}>{children}</Context.Provider>;
}
