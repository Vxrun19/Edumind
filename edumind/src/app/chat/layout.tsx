import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat",
  description:
    "Chat with your personal AI tutor. Ask anything, learn everything.",
  robots: { index: false, follow: false },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
