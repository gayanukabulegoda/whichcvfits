import type { Metadata } from "next";
import ProtectedLayout from "@/components/ProtectedLayout";
export const metadata: Metadata = {
  title: "Evaluation studio",
  robots: { index: false, follow: false },
};
export default ProtectedLayout;
