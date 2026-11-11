import ReliefArt from "@/components/ReliefArt";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "How your data is handled",
  description:
    "Learn where CV text, provider API keys, account information, and saved evaluations are processed and stored by WhichCVFits.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="container section prose">
        <div className="nm-raised card stack art-surface">
          <ReliefArt variant="rings" className="section-relief" />
          <span className="eyebrow">Your data, explained</span>
          <h1>Know what goes where.</h1>
          <p>
            This page describes the application’s data flow and controls.
            Provider terms and retention policies also apply when you choose to
            send CV text to an AI service.
          </p>
          <div className="prose-sections">
            <section>
              <h2>Before you evaluate</h2>
              <p>
                The workspace parses files on your device. Original CV files are
                not uploaded through the normal file picker. Queued CV text
                stays in browser memory until you evaluate; refreshing or
                closing the page clears an unevaluated queue.
              </p>
              <p>
                Only upload and evaluate candidate information you are
                authorized to process. Review the extracted text and remove
                unnecessary personal details before sending it.
              </p>
            </section>
            <section>
              <h2>When you evaluate</h2>
              <p>
                Your job criteria and CV text are sent to the WhichCVFits
                server, then to your selected Google, Anthropic, or OpenAI API
                model. The model receives professional information contained in
                the submitted CV. WhichCVFits does not send a CV to multiple
                providers in the same evaluation.
              </p>
              <p>
                Completed and partially completed runs save job criteria, CV
                text for successful candidates, scores, provider/model details,
                and evaluation explanations in your account’s database. Failed
                responses are recorded as errors without invented scores.
              </p>
            </section>
            <section>
              <h2>Your account and API keys</h2>
              <p>
                Your name and email identify your workspace. Passwords are
                salted and hashed with PBKDF2-SHA256. Sessions use signed,
                HttpOnly cookies that expire after seven days.
              </p>
              <p>
                API keys are encrypted with AES-256-GCM using a server-held
                secret. The server can decrypt them to call your selected
                provider. Only a masked preview is returned to the browser; this
                is server-side encryption, not zero-knowledge storage.
              </p>
            </section>
            <section>
              <h2>Saved data and deletion</h2>
              <p>
                Saved evaluations remain until you delete them from Settings &
                history. Deleting an evaluation removes its saved candidate text
                and results from the active database. Removing an API key stops
                new use of that saved credential without deleting earlier
                evaluations.
              </p>
              <p>
                Local migration backups and any hosting-provider backups are
                separate from the active database and must be managed by the
                installation operator. Deletion does not erase data already
                processed or retained by an external AI provider.
              </p>
            </section>
            <section>
              <h2>Provider information</h2>
              <ul>
                <li>
                  <a
                    className="text-link"
                    href="https://ai.google.dev/gemini-api/terms"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Gemini API terms
                  </a>
                </li>
                <li>
                  <a
                    className="text-link"
                    href="https://www.anthropic.com/legal/privacy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Anthropic privacy information
                  </a>
                </li>
                <li>
                  <a
                    className="text-link"
                    href="https://openai.com/enterprise-privacy/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenAI business data information
                  </a>
                </li>
              </ul>
            </section>
          </div>
          <div className="divider">
            <Link href="/settings" className="nm-btn">
              Manage keys & saved evaluations
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
