import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Structured learning paths across 10+ disciplines. From mathematics to philosophy.",
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
