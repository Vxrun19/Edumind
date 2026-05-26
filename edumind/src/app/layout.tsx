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
    default: "EduMind — AI Tutor for JEE & NEET Aspirants in India",
    template: "%s | EduMind",
  },
  description:
    "AI tutor built for JEE and NEET preparation in India. Step-by-step explanations in Physics, Chemistry, Maths, and Biology — with practice quizzes and weak-topic tracking. Available 24/7.",
  verification: {
    google: "8WzM8VLtICGD24BPm0Xu2k6vtCvXE9hObBEr9JiQL1o",
  },
  keywords: [
    "JEE preparation",
    "NEET preparation",
    "JEE AI tutor",
    "NEET AI tutor",
    "AI tutor India",
    "JEE Physics",
    "JEE Chemistry",
    "JEE Maths",
    "NEET Physics",
    "NEET Chemistry",
    "NEET Biology",
    "JEE Main",
    "JEE Advanced",
    "online JEE coaching",
    "online NEET coaching",
    "JEE NEET online tutor",
    "JEE NEET doubt solving",
  ],
  authors: [{ name: "EduMind" }],
  creator: "EduMind",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://edumind-omega.vercel.app",
    siteName: "EduMind",
    title: "EduMind — AI Tutor for JEE & NEET Aspirants",
    description:
      "AI tutor for JEE and NEET preparation. Step-by-step concept teaching in Physics, Chemistry, Maths, and Biology. Two tracks, one tutor.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduMind — AI Tutor for JEE & NEET Aspirants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMind — AI Tutor for JEE & NEET Aspirants",
    description:
      "AI tutor for JEE and NEET. Step-by-step explanations, practice quizzes, and weak-topic tracking.",
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
