"use client";

import Link from "next/link";
import AcademicLayout from "@/components/AcademicLayout";

export default function CoursesPage() {
  return (
    <AcademicLayout>
      <div className="flex flex-col items-center text-center max-w-xl mx-auto py-16 md:py-20">
        {/* Small ornament — same one used on landing CTA */}
        <div
          className="w-12 h-[1px] mb-6"
          style={{ background: "var(--border-accent)" }}
        />

        <span
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--accent)" }}
        >
          Coming soon
        </span>

        <h1
          className="font-serif text-[30px] sm:text-[36px] font-normal mt-4"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.3px", lineHeight: 1.15 }}
        >
          Focused JEE &amp; NEET course paths are in development.
        </h1>

        <p
          className="font-serif text-[16px] mt-5 max-w-md"
          style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
        >
          We&apos;re building structured paths for Physics, Chemistry,
          Mathematics, and Biology &mdash; aligned to the JEE and NEET syllabi.
          In the meantime, the AI tutor is ready to walk you through any
          concept, step by step.
        </p>

        <Link
          href="/chat"
          className="inline-block font-sans text-[14px] font-medium px-6 py-[11px] rounded-lg text-white mt-8 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.97]"
          style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
        >
          {"Start learning with the tutor →"}
        </Link>

        <p
          className="font-sans text-[13px] mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Free to start. No credit card needed.
        </p>
      </div>
    </AcademicLayout>
  );
}
