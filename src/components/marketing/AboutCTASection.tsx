"use client";

import { Link } from "@/routing";

/**
 * About Us CTA Section - Matches Figma design
 * Dark background with blue accents
 */
export function AboutCTASection() {
  return (
    <section className="px-5 py-24 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[32px] bg-[#0f172a] px-16 py-24">
          {/* Decorative blurs */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />

          {/* Content */}
          <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-6 text-center">
            <h2 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-white md:text-[48px] md:leading-[48px]">
              Ready to join the digital
              <br />
              revolution?
            </h2>

            <p className="max-w-[730px] text-[18px] leading-[28px] text-[#cbd5e1]">
              Start your journey with Global Ledger today and see why millions
              of shopkeepers trust us with their business.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-[#3c83f6] px-8 py-4 rounded-xl text-[18px] font-bold text-white transition-colors hover:bg-[#2563eb]"
              >
                Get Started Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] px-8 py-4 rounded-xl text-[18px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-[rgba(255,255,255,0.1)]"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
