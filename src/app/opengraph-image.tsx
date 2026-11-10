import { ImageResponse } from "next/og";
export const alt = "WhichCVFits — A clearer way to shortlist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 70,
          background: "#EFF3FA",
          color: "#0F172A",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
          WhichCV<span style={{ color: "#10B981" }}>Fits</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 750, letterSpacing: -4 }}>
            Less CV noise.
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 750,
              letterSpacing: -4,
              color: "#047857",
            }}
          >
            More right-fit conversations.
          </div>
          <div style={{ fontSize: 27, color: "#526079", marginTop: 30 }}>
            Your criteria. Your AI. Evidence you can review.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 23, color: "#526079" }}>
          Gemini · Claude · OpenAI | Bring your own key
        </div>
      </div>
    ),
    size,
  );
}
