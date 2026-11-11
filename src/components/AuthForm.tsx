"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Files,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { BrandMark, Wordmark } from "./BrandLogo";
import Notice from "./Notice";
import ReliefArt from "./ReliefArt";
import { post, errorMessage } from "@/lib/client";
export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await post<{ redirectTo: string }>("/api/auth", {
        action: signup ? "signup" : "login",
        name,
        email,
        password,
      });
      router.push(data.redirectTo);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="auth-container">
      <aside className="auth-story nm-flat">
        <ReliefArt className="auth-relief" />
        <div className="auth-story-copy">
          <span className="eyebrow">A little structure changes everything</span>
          <h2>
            Your next great hire.
            <br />
            <span className="ink-blue">A clearer way there.</span>
          </h2>
          <p>
            One focused space for the role, the candidates, and the evidence
            that connects them.
          </p>
        </div>
        <div className="auth-journey">
          {[
            {
              icon: FileText,
              title: "Your criteria",
              text: "Define what a good fit looks like.",
              tone: "blue",
            },
            {
              icon: Files,
              title: "Your candidates",
              text: "Bring your CVs. Keep the context.",
              tone: "green",
            },
            {
              icon: ScanLine,
              title: "Your next conversation",
              text: "A shortlist with evidence behind it.",
              tone: "blue",
            },
          ].map((item) => (
            <div className="auth-journey-step" key={item.title}>
              <span className={"icon-tile tone-" + item.tone}>
                <item.icon size={21} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="auth-story-note">
          <ShieldCheck size={17} />
          <span>Your AI key. Your professional judgment.</span>
        </div>
      </aside>
      <div className="nm-raised card stack auth-card">
        <BrandMark className="w-12 h-12" />
        <div>
          <span className="eyebrow mb-3">
            {signup ? "A clearer shortlist starts here" : "Welcome back"}
          </span>
          <h1 className="text-3xl">
            {signup ? "Create your workspace" : "Sign in to your workspace"}
          </h1>
          <p className="muted text-sm mt-3">
            {signup
              ? "Your criteria. Your AI. Your hiring decisions."
              : "Pick up where you left off with "}{" "}
            {!signup && <Wordmark />}
          </p>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <form onSubmit={submit} className="stack">
          {signup && (
            <div className="field">
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                className="nm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="e.g. Sarah Jenkins"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="nm-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <div className="password-control">
              <input
                id="auth-password"
                type={visible ? "text" : "password"}
                className="nm-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={signup ? 10 : 1}
                maxLength={256}
                autoComplete={signup ? "new-password" : "current-password"}
                aria-describedby={signup ? "password-help" : undefined}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {signup && (
              <small id="password-help">
                Use at least 10 characters. A passphrase works well.
              </small>
            )}
          </div>
          <button className="nm-btn-primary mt-1" type="submit" disabled={busy}>
            {busy
              ? signup
                ? "Creating workspace…"
                : "Signing in…"
              : signup
                ? "Create workspace"
                : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        {signup && (
          <p className="text-xs muted">
            Next, connect an AI provider or skip setup to explore. Real
            evaluations require a verified API key.
          </p>
        )}
        <div className="divider text-sm">
          <p className="muted">
            {signup ? "Already have an account?" : "New to WhichCVFits?"}{" "}
            <Link className="text-link" href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <a className="text-link text-xs self-start" href="/#sample-demo">
          Explore the sample first
        </a>
      </div>
    </main>
  );
}
