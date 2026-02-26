import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Mode",
  description:
    "Test your knowledge with AI-generated quizzes tailored to your level.",
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
