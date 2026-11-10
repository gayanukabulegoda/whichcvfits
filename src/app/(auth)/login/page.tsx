import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() {
  return (
    <>
      <Navbar />
      <AuthForm />
    </>
  );
}
