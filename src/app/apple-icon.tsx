import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg viewBox="0 0 64 64" width="180" height="180" fill="none">
          <defs>
            <linearGradient
              id="apple-brand"
              x2="64"
              y2="64"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4F46E5" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#apple-brand)" />
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
        </svg>
      </div>
    ),
    size,
  );
}
