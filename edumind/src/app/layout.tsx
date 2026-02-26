import type { Metadata } from "next";
import { Lora, Inter, Fira_Code } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import NavbarWrapper from "@/components/NavbarWrapper";
import PostHogIdentify from "@/components/PostHogIdentify";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://edumind-omega.vercel.app"),
  title: {
    default: "EduMind — Your Personal AI Tutor",
    template: "%s | EduMind",
  },
  description:
    "EduMind is your personal AI tutor. Learn any subject, master any skill, with adaptive AI guidance that grows with you.",
  verification: {
    google: "8WzM8VLtICGD24BPm0Xu2k6vtCvXE9hObBEr9JiQL1o",
  },
  keywords: [
    "AI tutor",
    "personal tutor",
    "learn online",
    "AI learning",
    "adaptive learning",
    "online education",
    "study app",
    "quiz app",
    "AI education",
  ],
  authors: [{ name: "EduMind" }],
  creator: "EduMind",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://edumind-omega.vercel.app",
    siteName: "EduMind",
    title: "EduMind — Your Personal AI Tutor",
    description:
      "Learn anything. Actually understand it. Your personal AI tutor that adapts to how you think.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduMind — Your Personal AI Tutor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMind — Your Personal AI Tutor",
    description: "Learn anything. Actually understand it.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${lora.variable} ${inter.variable} ${firaCode.variable}`}>
        <body className="font-sans antialiased">
          <PostHogIdentify />
          <NavbarWrapper />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
