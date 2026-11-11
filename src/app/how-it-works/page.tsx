import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "How CV screening works",
  description:
    "Understand WhichCVFits scoring, must-have requirements, supported CV formats, and bring-your-own-key AI evaluations.",
  alternates: { canonical: "/how-it-works" },
};
export default function HowItWorks() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="container section prose">
        <div className="nm-raised card stack">
          <span className="eyebrow">A practical guide</span>
          <h1>A shortlist you can understand.</h1>
          <p>
            WhichCVFits helps recruiters compare CV evidence against the same
            job criteria. It assists your review; it does not decide who gets
            hired.
          </p>
          <div className="prose-sections">
            <section>
              <h2>1. Describe the role</h2>
              <p>
                Add the responsibilities, skills, experience, and qualifications
                that matter to the job. Optional must-have requirements are
                assessed separately from the weighted score.
              </p>
            </section>
            <section>
              <h2>2. Review the CV text</h2>
              <p>
                Your browser reads PDF, DOCX, TXT, and Markdown files locally.
                You can inspect and edit extracted text before evaluating. The
                queue supports 20 CVs, files up to 5 MiB, PDF documents up to 30
                pages, and 50,000 characters per CV.
              </p>
              <p>
                Scanned, unreadable, and password-protected PDFs cannot be
                evaluated from their images. Paste readable text instead.
                Original files are not uploaded by the normal workspace flow.
              </p>
            </section>
            <section>
              <h2>3. Choose your AI</h2>
              <p>
                Connect a verified Google Gemini, Anthropic Claude, or OpenAI
                API key. Choose an available supported model and, where
                supported, a reasoning effort. Your provider bills API use
                directly; account access and quota depend on that provider.
              </p>
            </section>
            <section>
              <h2>4. Understand the score</h2>
              <p>
                Four scores contribute to the overall match: hard skills (40%),
                relevant experience (30%), domain and impact (20%), and
                qualifications (10%). You can change these weights; positive
                totals are normalized to 100%.
              </p>
              <p>
                A mandatory requirement needs affirmative CV evidence. If it is
                unmet or unclear, the result cannot be shortlisted and the score
                is capped at 45. Missing CV evidence is not proof that someone
                lacks a skill.
              </p>
              <ul>
                <li>85–100: Top fit</li>
                <li>70–84: Strong fit</li>
                <li>50–69: Partial fit</li>
                <li>Below 50: Weak fit</li>
              </ul>
              <p>
                Your chosen shortlist threshold applies only when all must-haves
                are evidenced. Eligible candidates appear before disqualified
                candidates, with scores sorted high to low.
              </p>
            </section>
            <section>
              <h2>5. Make the next conversation count</h2>
              <p>
                Read the supporting quotes, compare up to three candidates, and
                use tailored interview questions to investigate gaps. Quotes are
                checked against the submitted text, not independently
                fact-checked. AI judgments can vary between runs.
              </p>
              <p>
                Provider failures are shown explicitly. A failed candidate
                receives no invented score; you can retry failed CVs without
                evaluating successful candidates again.
              </p>
            </section>
          </div>
          <div className="row wrap divider">
            <Link href="/signup" className="nm-btn-primary">
              Create your workspace <ArrowRight size={17} />
            </Link>
            <Link className="text-link text-sm" href="/privacy">
              Read about data handling
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
