import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tutor Chat",
  description:
    "Step-by-step JEE and NEET tutoring in Physics, Chemistry, Mathematics, and Biology.",
  robots: { index: false, follow: false },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
