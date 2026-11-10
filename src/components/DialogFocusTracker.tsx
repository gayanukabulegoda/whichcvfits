"use client";
import { useEffect } from "react";
let invocation: { element: HTMLElement; time: number } | null = null;
/** Safari does not focus buttons on pointer clicks. Remember the invoking control
 * before React mounts the dialog, including dialogs with lazy-loaded content. */
export function dialogInvokingControl(): HTMLElement | null {
  const recent = invocation;
  invocation = null;
  return recent &&
    recent.element.isConnected &&
    performance.now() - recent.time < 1000
    ? recent.element
    : null;
}
export default function DialogFocusTracker() {
  useEffect(() => {
    function remember(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('button,a[href],[role="button"]')
          : null;
      if (target && !target.closest("dialog"))
        invocation = { element: target, time: performance.now() };
    }
    document.addEventListener("click", remember, true);
    return () => document.removeEventListener("click", remember, true);
  }, []);
  return null;
}
