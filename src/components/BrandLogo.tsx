import React from "react";
export function BrandMark({
  className = "w-9 h-9",
  size,
}: {
  className?: string;
  size?: number;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill={"url(#brand" + id + ")"} />
      <path
        d="M14 22L22 44L31 27L39 44L52 18"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39 44L52 18"
        stroke="#34D399"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="52" cy="18" r="3.5" fill="#34D399" />
      <defs>
        <linearGradient
          id={"brand" + id}
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={"wordmark " + className}
      role="img"
      aria-label="WhichCVFits"
    >
      <span aria-hidden="true" style={{ color: "#0F172A" }}>
        WhichCV
      </span>
      <span
        aria-hidden="true"
        className="wordmark-fits"
        style={{ color: "#10B981" }}
      >
        Fits
      </span>
    </span>
  );
}
export default function BrandLogo({
  size = "md",
  showSubtitle = false,
}: {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}) {
  return (
    <span className="brand-logo">
      <BrandMark className={size === "lg" ? "w-12 h-12" : "w-9 h-9"} />
      <span>
        <Wordmark
          className={
            size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl"
          }
        />
        {showSubtitle && (
          <span className="brand-caption">A clearer way to shortlist.</span>
        )}
      </span>
    </span>
  );
}
