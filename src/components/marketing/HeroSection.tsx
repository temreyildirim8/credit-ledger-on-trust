"use client";

import { Link } from "@/routing";
import { ArrowRight, Play, Download, Shield, CheckCircle } from "lucide-react";

/**
 * Hero section - Matches Figma design
 * Light background, large headline, CTAs, hero image
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f5f7f8]">
      <div className="relative max-w-[1280px] mx-auto px-6 pt-[70px] pb-[86px]">
        <div className="flex gap-[54px] items-center justify-center">
          {/* Content */}
          <div className="flex-1 max-w-[584px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(60,131,246,0.1)] border border-[rgba(60,131,246,0.2)] px-[17px] py-[9px] rounded-full mb-[70px]">
              <CheckCircle className="h-3 w-3 text-[#3c83f6]" />
              <span className="text-[12px] font-bold text-[#3c83f6] uppercase tracking-[0.6px]">
                Trusted by 50,000+ SMEs
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[72px] font-black leading-[72px] tracking-[-1.8px] text-[#0f172a] mb-8">
              The Digital
              <br />
              Ledger for Your
              <br />
              <span className="text-[#3c83f6]">Local Business</span>
            </h1>

            {/* Description */}
            <p className="text-[18px] leading-[29px] text-[#475569] max-w-[576px] mb-12">
              Protect your profits from inflation and never lose a record again.
              Secure, cloud-synced, and built specifically for micro-SMEs in
              evolving economies.
            </p>

            {/* CTAs */}
            <div className="flex gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-3 bg-[#3c83f6] text-white px-10 py-[22px] rounded-full text-[18px] font-bold transition-all duration-200 shadow-[0px_20px_25px_-5px_rgba(60,131,246,0.3),0px_8px_10px_-6px_rgba(60,131,246,0.3)] hover:bg-[#3b82f6]"
              >
                <Download className="h-5 w-5" />
                Install PWA
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-3 bg-white border-2 border-[#f1f5f9] text-[#0f172a] px-[42px] py-[22px] rounded-full text-[18px] font-bold transition-all duration-200 hover:border-[#e2e8f0]"
              >
                <Play className="h-5 w-5" />
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1 max-w-[594px]">
            {/* Blue blur decoration */}
            <div className="absolute bg-[rgba(60,131,246,0.2)] blur-[60px] w-[384px] h-[384px] rounded-full -right-20 -top-[70px]" />

            {/* Main image container */}
            <div className="relative rotate-[2deg]">
              <div className="bg-transparent rounded-[48px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
                <div className="aspect-square w-full max-w-[584px] bg-gradient-to-br from-[#3c83f6] to-[#1d4ed8] flex items-center justify-center">
                  {/* Placeholder for hero image - shows app mockup */}
                  <div className="text-white text-center p-12">
                    <Shield className="h-24 w-24 mx-auto mb-6 opacity-80" />
                    <p className="text-2xl font-bold mb-2">Secure Digital Ledger</p>
                    <p className="text-white/80">Your data, always protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
