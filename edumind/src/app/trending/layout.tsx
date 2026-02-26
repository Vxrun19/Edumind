import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending Topics",
  description:
    "Discover what scholars are learning right now. Curated topics updated daily.",
};

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
