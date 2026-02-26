import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress",
  description:
    "Track your learning progress, streaks, and subject mastery over time.",
  robots: { index: false, follow: false },
};

export default function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
