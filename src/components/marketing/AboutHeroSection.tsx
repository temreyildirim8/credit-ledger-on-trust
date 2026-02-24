"use client";

import { Link } from "@/routing";
import { Globe } from "lucide-react";

/**
 * About Us Hero Section - Matches Figma design
 * "Digitizing 100M+ Micro-SMEs" headline with globe visual
 */
export function AboutHeroSection() {
  return (
    <section className="relative overflow-hidden bg-white px-5 py-[128px] md:px-20">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 50%, rgba(60,131,246,0.05) 0%, rgba(60,131,246,0) 50%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-12 lg:flex-row lg:gap-12">
        {/* Content */}
        <div className="flex flex-1 flex-col items-start gap-8">
          {/* Badge */}
          <div className="inline-flex items-center bg-[rgba(60,131,246,0.1)] px-3 py-1 rounded-full">
            <span className="text-[12px] font-bold text-[#3c83f6] uppercase tracking-[0.6px]">
              Our Mission
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[48px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#0f172a] md:text-[72px] md:leading-[72px] md:tracking-[-1.8px]">
            Digitizing
            <br />
            <span className="text-[#3c83f6]">100M+ </span>
            <span className="text-[#3c83f6]">Micro-</span>
            <br />
            <span className="text-[#3c83f6]">SMEs</span>
          </h1>

          {/* Description */}
          <p className="max-w-[576px] text-[18px] leading-[28px] text-[#475569] md:text-[20px]">
            Empowering local shopkeepers in high-inflation economies with digital
            trust, seamless ledger management, and financial inclusion.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#0f172a] px-8 py-4 rounded-lg text-[16px] font-bold text-white transition-colors hover:bg-[#1e293b]"
            >
              View Our Impact
            </Link>
            <div className="flex items-center gap-4">
              {/* Avatar stack */}
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#e2e8f0]" />
                <div className="-ml-2 h-10 w-10 rounded-full border-2 border-white bg-[#cbd5e1]" />
                <div className="-ml-2 h-10 w-10 rounded-full border-2 border-white bg-[#94a3b8]" />
              </div>
              <span className="text-[14px] font-medium text-[#64748b]">
                Trusted by 5M+ owners
              </span>
            </div>
          </div>
        </div>

        {/* Globe Visual */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative h-[400px] w-[400px] md:h-[500px] md:w-[500px]">
            {/* Globe background */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#f8fafc]">
              <Globe className="h-24 w-24 text-[#3c83f6] opacity-40" />
            </div>

            {/* Floating currency symbols */}
            <div className="absolute left-[40px] top-[40px] rounded-xl bg-white p-3 shadow-lg">
              <span className="text-[16px] font-bold text-[#3c83f6]">₺</span>
            </div>
            <div className="absolute right-0 top-[80px] rounded-xl bg-white p-3 shadow-lg">
              <span className="text-[16px] font-bold text-[#3c83f6]">₹</span>
            </div>
            <div className="absolute bottom-[80px] left-0 rounded-xl bg-white p-3 shadow-lg">
              <span className="text-[16px] font-bold text-[#3c83f6]">₦</span>
            </div>
            <div className="absolute bottom-[40px] right-[40px] rounded-xl bg-white p-3 shadow-lg">
              <span className="text-[16px] font-bold text-[#3c83f6]">Rp</span>
            </div>

            {/* Inner shadow */}
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]]" />
          </div>
        </div>
      </div>
    </section>
  );
}
