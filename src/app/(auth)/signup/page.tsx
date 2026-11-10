import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Create your workspace" };
export default function SignupPage() {
  return (
    <>
      <Navbar />
      <AuthForm signup />
    </>
  );
}
