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
  Quote,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SampleDemo from "@/components/SampleDemo";
import ReliefArt from "@/components/ReliefArt";
import { SITE_URL } from "@/lib/seo";
import { Wordmark } from "@/components/BrandLogo";
const steps = [
  {
    icon: FileText,
    num: "01",
    title: "Set the direction",
    copy: "Define the role, the must-haves, and what matters most. Your criteria stay at the center.",
    tone: "blue",
  },
  {
    icon: Files,
    num: "02",
    title: "Bring in your CVs",
    copy: "Drop in a batch, check the extracted text, and choose when you’re ready to evaluate.",
    tone: "green",
  },
  {
    icon: ScanLine,
    num: "03",
    title: "Find your next conversation",
    copy: "Review ranked matches, check the evidence, and compare your strongest candidates.",
    tone: "blue",
  },
];
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="landing-main">
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
          <div className="hero-intro">
            <span className="hero-kicker">
              <span className="status-dot" /> A clearer way to shortlist{" "}
              <span className="kicker-line" />
            </span>
            <h1>
              Less CV noise.
              <br />
              <span className="ink-blue">More clarity.</span>
              <br />
              <span className="ink-green">Better conversations.</span>
            </h1>
            <div className="hero-body">
              <p className="hero-copy">
                Turn a stack of CVs into a shortlist you can explain. Your job
                criteria, your preferred AI, and the evidence behind every
                match.
              </p>
              <div className="row wrap cta-row gap-3">
                <Link href="/signup" className="nm-btn-primary">
                  Create your workspace <ArrowUpRight size={17} />
                </Link>
                <a href="#sample-demo" className="nm-btn">
                  Try the sample <ArrowRight size={17} />
                </a>
              </div>
              <div className="hero-proof">
                <span>
                  <Check size={14} />
                  Your criteria, your weights
                </span>
                <span>
                  <Check size={14} />
                  Your AI provider
                </span>
              </div>
            </div>
            <div className="hero-assurance">
              <span className="icon-tile tone-green">
                <ShieldCheck size={21} />
              </span>
              <div>
                <strong>Private by design. Clear by choice.</strong>
                <p>
                  Files are read on your device. You choose when CV text goes to
                  your provider.
                </p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <ReliefArt className="hero-relief" />
            <div className="floating-caption caption-blue">
              <span className="caption-dot" /> Made for thoughtful hiring
            </div>
            <SampleDemo />
            <div className="floating-caption caption-green">
              <ShieldCheck size={15} /> Evidence you can review
            </div>
          </div>
        </section>
        <div className="container trust-rail">
          <span className="trust-label">ONE FOCUSED WORKSPACE</span>
          <span>
            <FileText size={17} /> PDF · DOCX · TXT · MD
          </span>
          <span>
            <Files size={17} /> Up to 20 CVs per review
          </span>
          <span>
            <KeyRound size={17} /> Gemini · Claude · OpenAI
          </span>
        </div>
        <section className="container section" id="how-it-works">
          <div className="section-heading section-heading-row">
            <div>
              <span className="eyebrow">
                A little structure. A lot more clarity.
              </span>
              <h2>
                From a pile of CVs
                <br />
                to a clearer next step.
              </h2>
            </div>
            <p>
              Three simple steps. One consistent review.
              <br />A shortlist with something behind it.
            </p>
          </div>
          <div className="feature-grid">
            {steps.map((item) => (
              <article
                className={"nm-flat feature-card art-surface tone-" + item.tone}
                key={item.num}
              >
                <ReliefArt
                  variant="rings"
                  className="section-relief section-relief-small"
                />
                <div className="row between">
                  <span className={"icon-tile tone-" + item.tone}>
                    <item.icon size={23} />
                  </span>
                  <span className="step-label">STEP {item.num}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <span className="feature-rule" />
              </article>
            ))}
          </div>
        </section>
        <section className="container section">
          <div className="workflow-panel nm-raised art-surface">
            <ReliefArt variant="rings" className="section-relief" />
            <div className="workflow-intro">
              <span className="eyebrow">Your AI. Your point of view.</span>
              <h2>
                A little intelligence.
                <br />
                <span className="ink-blue">A lot more context.</span>
              </h2>
              <p>
                Connect the provider you trust. Keep the rubric, the threshold,
                and the final decision in your hands.
              </p>
              <div className="provider-pills">
                <span>Gemini</span>
                <span>Claude</span>
                <span>OpenAI</span>
              </div>
              <Link className="text-link" href="/how-it-works">
                See how it works <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="workflow-benefits">
              {[
                {
                  icon: SlidersHorizontal,
                  title: "Built around your criteria",
                  copy: "Weight skills, experience, impact, and qualifications to match the role.",
                  tone: "blue",
                },
                {
                  icon: Quote,
                  title: "Every match needs a reason",
                  copy: "Read supporting CV quotes and see precisely why a must-have was not evidenced.",
                  tone: "green",
                },
                {
                  icon: ShieldCheck,
                  title: "You stay in control",
                  copy: "Use your own API key. Export your results or delete saved evaluations whenever you choose.",
                  tone: "blue",
                },
              ].map((item) => (
                <div className="benefit-row" key={item.title}>
                  <span className={"icon-tile tone-" + item.tone}>
                    <item.icon size={21} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="container section faq-layout">
          <div className="faq-intro">
            <span className="eyebrow">Before you begin</span>
            <h2>
              Good questions.
              <br />
              <span className="ink-green">Clear answers.</span>
            </h2>
            <p>A few things to know before your first review.</p>
            <div className="faq-mark" aria-hidden="true">
              ?
            </div>
          </div>
          <div className="faq-list">
            {[
              [
                "Do I need an API key?",
                "You can create an account and explore the studio without a key. To evaluate real CVs, connect a verified API key for your selected provider. Your provider bills API usage directly.",
              ],
              [
                "Is a match score a hiring decision?",
                "No. Scores summarize CV evidence against your chosen criteria. Read the supporting quotes, explore uncertainties in an interview, and make your own decision.",
              ],
              [
                "Which CV files can I use?",
                "Text-based PDF, DOCX, TXT, and Markdown files are supported, with up to 20 CVs in a queue. Scanned or password-protected PDFs need readable text pasted instead.",
              ],
              [
                "Where does candidate information go?",
                "Files are parsed locally in your browser. When you run an evaluation, CV text goes through our server to the AI provider you select. Saved results remain in your account until you delete them.",
              ],
            ].map(([q, a]) => (
              <details className="nm-flat faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container section">
          <div className="closing-panel nm-raised">
            <ReliefArt className="closing-relief" />
            <div>
              <span className="eyebrow">
                Make room for better conversations
              </span>
              <h2>
                Find your next <Wordmark />.
              </h2>
              <p>Start with your criteria. Let the evidence help you decide.</p>
            </div>
            <Link className="nm-btn-primary" href="/signup">
              Create your workspace <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
