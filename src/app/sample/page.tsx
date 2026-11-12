import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ListOrdered,
  MousePointer2,
  Quote,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SampleDemo from "@/components/SampleDemo";

const title = "Try the CV screening sample";
const description =
  "Explore fictional CVs, preset match scores, and supporting evidence in the WhichCVFits sample. No account, uploads, API key, or AI calls required.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sample" },
  openGraph: {
    title,
    description,
    url: "/sample",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "WhichCVFits — a clearer way to shortlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};
export default function SamplePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="container sample-page">
        <Link href="/" className="text-link sample-back">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <header className="sample-intro">
          <div>
            <span className="eyebrow">A hands-on look, without the setup</span>
            <h1>See a shortlist take shape.</h1>
            <p>
              Explore three fictional CVs and their preset assessments. Rank the
              examples, select a candidate, and review the supporting excerpt.
            </p>
          </div>
          <span className="sample-access badge badge-blue">
            <ShieldCheck size={15} /> No account or API key needed
          </span>
        </header>
        <div className="sample-page-grid">
          <SampleDemo />
          <aside className="sample-guide" aria-label="Sample guidance">
            <section className="nm-flat card stack sample-guide-card">
              <span className="eyebrow">What to look for</span>
              <h2>A score is the starting point.</h2>
              <ol className="sample-guide-steps">
                {[
                  {
                    icon: ListOrdered,
                    title: "Rank the examples",
                    text: "Order the three profiles by their preset match scores.",
                    tone: "blue",
                  },
                  {
                    icon: MousePointer2,
                    title: "Select a candidate",
                    text: "See the example assessment and the skills behind it.",
                    tone: "green",
                  },
                  {
                    icon: Quote,
                    title: "Read the evidence",
                    text: "Check the excerpt and notice where a must-have is missing.",
                    tone: "blue",
                  },
                ].map((item) => (
                  <li key={item.title}>
                    <span className={"icon-tile tone-" + item.tone}>
                      <item.icon size={19} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="nm-inset card stack sample-next">
              <h2>Ready to try your own criteria?</h2>
              <p>
                Create a workspace, add a role and CVs, then connect your own AI
                provider. Real evaluations require a verified API key; your
                provider bills API usage.
              </p>
              <Link href="/signup" className="nm-btn-primary">
                Create your workspace <ArrowUpRight size={16} />
              </Link>
              <Link href="/how-it-works" className="text-link">
                See how real evaluations work
              </Link>
              <p className="sample-limits">
                This sample uses fixed, illustrative results. It does not
                evaluate files or make hiring decisions.
              </p>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
