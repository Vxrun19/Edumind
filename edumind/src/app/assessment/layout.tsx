import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Assessment",
  description:
    "Take your personalized learning assessment to calibrate your AI tutor.",
  robots: { index: false, follow: false },
};

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
