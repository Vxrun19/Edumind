import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EduMind — Your Personal AI Tutor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F9F7F3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#7C5C2E",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            marginBottom: 24,
          }}
        >
          AI TUTOR FOR JEE & NEET
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            color: "#1A1714",
            textAlign: "center" as const,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Master JEE & NEET concepts. One step at a time.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#5C5750",
            marginTop: 32,
            textAlign: "center" as const,
          }}
        >
          edumind-omega.vercel.app
        </div>
        <div
          style={{
            position: "absolute" as const,
            bottom: 40,
            right: 60,
            fontSize: 32,
            fontWeight: 700,
            color: "#7C5C2E",
          }}
        >
          EduMind
        </div>
      </div>
    ),
    { ...size }
  );
}
