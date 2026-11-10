import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
export default function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "warning" | "success";
}) {
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div
      className={"notice notice-" + tone}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
