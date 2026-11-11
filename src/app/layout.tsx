import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";
import BrandCanvas from "@/components/BrandCanvas";
import DialogFocusTracker from "@/components/DialogFocusTracker";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WhichCVFits — Evidence-backed CV screening with your own AI",
    template: "%s | WhichCVFits",
  },
  description:
    "Turn job requirements and candidate CVs into a clear shortlist with supporting evidence. Bring your own Gemini, Claude, or OpenAI API key.",
  applicationName: "WhichCVFits",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "WhichCVFits",
    locale: "en_US",
    url: SITE_URL,
    title: "WhichCVFits — A clearer way to shortlist",
    description: "Your criteria. Your AI. Evidence you can review.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhichCVFits — A clearer way to shortlist",
    description: "Evidence-backed CV screening with your own AI provider.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E8EDF5",
  colorScheme: "light",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BrandCanvas />
        <DialogFocusTracker />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
