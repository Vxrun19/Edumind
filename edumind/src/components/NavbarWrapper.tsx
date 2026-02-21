"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Don't show the app navbar on the landing page — it has its own
  if (pathname === "/") return null;

  return <Navbar />;
}
