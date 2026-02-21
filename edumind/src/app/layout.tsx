import type { Metadata } from "next";
import { Lora, Inter, Fira_Code } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import NavbarWrapper from "@/components/NavbarWrapper";
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
  title: "EduMind — Your Personal AI Tutor",
  description:
    "Learn anything. Actually understand it. Your personal AI tutor that adapts to how you think.",
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
          <NavbarWrapper />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
