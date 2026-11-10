import Link from "next/link";
import Navbar from "@/components/Navbar";
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="container section max-w-xl">
        <div className="nm-raised card stack text-center items-center">
          <span className="eyebrow">404</span>
          <h1>This page is out of the shortlist.</h1>
          <p className="muted">
            The address may have changed. Head back to the studio or the home
            page.
          </p>
          <Link href="/" className="nm-btn-primary">
            Go home
          </Link>
        </div>
      </main>
    </>
  );
}
