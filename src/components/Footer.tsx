import Link from "next/link";
import BrandLogo from "./BrandLogo";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="stack gap-2">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
          <p className="muted">Thoughtful screening. Better conversations.</p>
        </div>
        <nav className="row wrap gap-x-6" aria-label="Footer">
          <Link href="/sample" className="nav-link">
            Try the sample
          </Link>
          <Link href="/how-it-works" className="nav-link">
            How it works
          </Link>
          <Link href="/privacy" className="nav-link">
            Your data
          </Link>
          <Link href="/login" className="nav-link">
            Sign in
          </Link>
        </nav>
        <p className="muted w-full">
          © {new Date().getFullYear()} WhichCVFits. Match scores support your
          review; hiring decisions remain yours.
        </p>
      </div>
    </footer>
  );
}
