import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description:
    "All your past learning conversations, saved and searchable.",
  robots: { index: false, follow: false },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
