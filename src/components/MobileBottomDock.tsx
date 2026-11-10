"use client";
import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
export default function MobileBottomDock({
  disabled,
  busy,
  onRun,
  reason,
  count,
}: {
  disabled: boolean;
  busy: boolean;
  onRun: () => void;
  reason: string;
  count: number;
}) {
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () =>
      setKeyboard(
        Boolean(viewport && window.innerHeight - viewport.height > 150),
      );
    viewport?.addEventListener("resize", update);
    return () => viewport?.removeEventListener("resize", update);
  }, []);
  if (keyboard) return null;
  return (
    <div className="mobile-action">
      <p aria-live="polite">
        {busy
          ? "Waiting for the AI provider. You can keep this page open."
          : reason || "Ready when you are. Your provider bills API usage."}
      </p>
      <button
        className="nm-btn-primary"
        disabled={disabled || busy}
        onClick={onRun}
      >
        {busy ? <LoaderCircle size={18} /> : <ArrowRight size={18} />}{" "}
        {busy
          ? "Evaluating CVs…"
          : "Evaluate " + count + " CV" + (count === 1 ? "" : "s")}
      </button>
    </div>
  );
}
