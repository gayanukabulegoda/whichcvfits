import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  FileText,
  Files,
  ScanLine,
  KeyRound,
  Check,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SampleDemo from "@/components/SampleDemo";
import { SITE_URL } from "@/lib/seo";
import { Wordmark } from "@/components/BrandLogo";
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "WhichCVFits",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: SITE_URL,
              description:
                "Bring-your-own-key CV screening with weighted criteria and supporting evidence.",
            }).replace(/</g, "\\u003c"),
          }}
        />
        <section className="container hero">
          <div>
            <span className="eyebrow">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              For the person behind the shortlist
            </span>
            <h1>
              Less CV noise.
              <br />
              More <span className="text-emerald-700">right-fit</span>
              <br />
              conversations.
            </h1>
            <p className="hero-copy">
              Turn your job requirements and a stack of CVs into a clear,
              evidence-backed shortlist. Bring your own AI key. Keep your
              judgment.
            </p>
            <div className="row wrap cta-row mt-7 gap-3">
              <Link href="/signup" className="nm-btn-primary">
                Create your workspace <ArrowUpRight size={17} />
              </Link>
              <a href="#sample-demo" className="nm-btn">
                Try the sample <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <Check size={14} className="inline mr-1 text-emerald-700" />
                Your criteria, your weights
              </span>
              <span>
                <Check size={14} className="inline mr-1 text-emerald-700" />
                Gemini · Claude · OpenAI
              </span>
            </div>
            <div className="row mt-8 text-xs muted">
              <span className="nm-flat-sm p-2.5 text-emerald-700">
                <ShieldCheck size={18} />
              </span>
              <p>
                Files are read on your device.
                <br />
                You choose when CV text goes to your AI provider.
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <SampleDemo />
          </div>
        </section>
        <section className="container section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">
              A little structure changes everything
            </span>
            <h2>
              From a pile of CVs
              <br />
              to a clearer next step.
            </h2>
            <p>
              One focused workspace. Three simple steps. Every result gives you
              something useful to review.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: FileText,
                num: "01",
                title: "Define what matters",
                copy: "Add your job description and must-have requirements. Adjust four scoring areas to reflect the role.",
              },
              {
                icon: Files,
                num: "02",
                title: "Bring in your candidates",
                copy: "Add PDF, DOCX, TXT, or Markdown CVs. Review the extracted text before you send anything for evaluation.",
              },
              {
                icon: ScanLine,
                num: "03",
                title: "Review the evidence",
                copy: "See ranked matches, direct CV quotes, and focused interview questions. Compare candidates and decide who to speak with.",
              },
            ].map((item) => (
              <article className="nm-flat card stack" key={item.num}>
                <div className="row between">
                  <span className="nm-inset p-3 text-emerald-700">
                    <item.icon size={23} />
                  </span>
                  <span className="muted text-xs font-semibold">
                    {item.num}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p className="text-sm muted leading-relaxed">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="container section">
          <div className="nm-raised card grid md:grid-cols-2 gap-8 items-center">
            <div className="stack">
              <span className="eyebrow">
                <KeyRound size={15} />
                Bring your own key
              </span>
              <h2>
                Your preferred AI.
                <br />A workspace built for review.
              </h2>
              <p className="muted text-sm">
                Connect Gemini, Claude, or OpenAI. Your API key is encrypted on
                the server and your provider bills API usage directly. Choose
                the model and supported reasoning effort before every run.
              </p>
              <Link
                href="/how-it-works"
                className="text-link text-sm self-start"
              >
                See how it works <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            <div className="stack gap-4">
              {[
                {
                  icon: SlidersHorizontal,
                  title: "Transparent scoring",
                  copy: "Understand the rubric, the threshold, and why a must-have was not evidenced.",
                },
                {
                  icon: ShieldCheck,
                  title: "You stay in control",
                  copy: "Keep the human review. Export your results or delete saved evaluations whenever you choose.",
                },
              ].map((item) => (
                <div key={item.title} className="nm-inset p-5 row items-start">
                  <item.icon size={22} className="text-emerald-700 mt-1" />
                  <div>
                    <h3 className="text-base">{item.title}</h3>
                    <p className="text-sm muted mt-2">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="container section max-w-3xl">
          <div className="section-heading">
            <span className="eyebrow">Before you begin</span>
            <h2>A few things, made clear.</h2>
          </div>
          <div className="stack">
            {[
              [
                "Do I need an API key?",
                "You can create an account and explore the studio without a key. To evaluate real CVs, connect a verified API key for your selected provider.",
              ],
              [
                "Is a match score a hiring decision?",
                "No. Scores summarize the evidence against your chosen criteria. Read the supporting quotes, explore uncertainties in an interview, and make your own decision.",
              ],
              [
                "Which CV files can I use?",
                "Text-based PDF, DOCX, TXT, and Markdown files are supported, with up to 20 CVs in a queue. Scanned or password-protected PDFs need readable text pasted instead.",
              ],
              [
                "Where does candidate information go?",
                "Files are parsed locally in your browser. When you run an evaluation, CV text goes through our server to the AI provider you select. Saved results remain in your account until you delete them.",
              ],
            ].map(([question, answer]) => (
              <details className="nm-flat card" key={question}>
                <summary>{question}</summary>
                <p className="text-sm muted">{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container section text-center">
          <div className="nm-raised card py-10 stack items-center">
            <span className="eyebrow">Make room for better conversations</span>
            <h2>
              Find your next <Wordmark />.
            </h2>
            <p className="muted text-sm max-w-lg">
              Start with your criteria. Let the evidence help you decide.
            </p>
            <Link className="nm-btn-primary" href="/signup">
              Get started <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
