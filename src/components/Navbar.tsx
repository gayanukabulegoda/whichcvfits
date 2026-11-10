"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Menu,
  LogOut,
  LayoutDashboard,
  Settings,
  ArrowRight,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import Dialog from "./Dialog";
import Notice from "./Notice";
import { post, errorMessage } from "@/lib/client";
import type { SessionUser } from "@/lib/contracts";
export default function Navbar({ user }: { user?: SessionUser | null }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const links = user
    ? [
        { href: "/dashboard", label: "Studio", icon: LayoutDashboard },
        { href: "/settings", label: "Settings & history", icon: Settings },
      ]
    : [
        { href: "/how-it-works", label: "How it works", icon: ArrowRight },
        { href: "/#sample-demo", label: "Try the sample", icon: ArrowRight },
      ];
  async function logout() {
    setBusy(true);
    try {
      await post("/api/auth", { action: "logout" });
      setOpen(false);
      router.push("/login");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <div className="container nm-flat header-inner">
          <Link href={user ? "/dashboard" : "/"} aria-label="WhichCVFits home">
            <BrandLogo showSubtitle />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((l) => (
              <Link
                className="nav-link"
                href={l.href}
                key={l.href}
                aria-current={path === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <span className="text-xs muted max-w-32 truncate">
                  {user.name}
                </span>
                <button
                  className="nm-btn icon-btn"
                  onClick={logout}
                  disabled={busy}
                  aria-label="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" href="/login">
                  Sign in
                </Link>
                <Link className="nm-btn-primary" href="/signup">
                  Get started <ArrowUpRight size={16} />
                </Link>
              </>
            )}
          </nav>
          <div className="mobile-menu">
            {!user && (
              <Link className="nm-btn-primary" href="/signup">
                Sign up
              </Link>
            )}
            <button
              className="nm-btn icon-btn"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>
      <Dialog open={open} onClose={() => setOpen(false)} title="Your workspace">
        {user && (
          <p className="muted text-sm mb-4 break-words">
            Signed in as {user.name}
          </p>
        )}
        <nav className="stack" aria-label="Mobile navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nm-btn justify-start"
              onClick={() => setOpen(false)}
            >
              <l.icon size={18} />
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              className="nm-btn justify-start"
              disabled={busy}
              onClick={logout}
            >
              <LogOut size={18} />
              Sign out
            </button>
          ) : (
            <Link
              className="nm-btn"
              href="/login"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          )}
        </nav>
        {error && (
          <div className="mt-4">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
      </Dialog>
      {error && !open && (
        <div className="container mt-3">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </>
  );
}
