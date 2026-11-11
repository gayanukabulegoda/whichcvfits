"use client";
import ReliefArt from "@/components/ReliefArt";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="container section max-w-xl">
      <div className="nm-raised card stack art-surface">
        <ReliefArt variant="rings" className="section-relief" />
        <h1>Let’s try that again.</h1>
        <p className="muted">
          This page could not be loaded. Your saved evaluations are still in
          your account.
        </p>
        <button className="nm-btn-primary" onClick={reset}>
          Try again
        </button>
        <a href="/" className="text-link text-sm">
          Back to home
        </a>
      </div>
    </main>
  );
}
