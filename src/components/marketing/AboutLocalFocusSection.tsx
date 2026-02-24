"use client";

/**
 * About Us Hyper-Local Focus Section - Matches Figma design
 * Shows regional focus cards for Turkey, India, Indonesia, Nigeria
 */
export function AboutLocalFocusSection() {
  const regions = [
    {
      flag: "🇹🇷",
      name: "Turkey",
      description: "The \"Esenaf\" tradition, digitized.",
      stat: "500k+ Artisans",
    },
    {
      flag: "🇮🇳",
      name: "India",
      description: "Powering the Kirana network.",
      stat: "2M+ Stores",
    },
    {
      flag: "🇮🇩",
      name: "Indonesia",
      description: "Connecting the local Warungs.",
      stat: "1.5M+ Warungs",
    },
    {
      flag: "🇳🇬",
      name: "Nigeria",
      description: "Facilitating cross-city trade.",
      stat: "800k+ Traders",
    },
  ];

  return (
    <section className="bg-white px-5 py-24 md:px-20">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.9px] text-[#0f172a]">
            Hyper-Local Focus
          </h2>
          <p className="max-w-[672px] text-[18px] leading-[28px] text-[#475569]">
            We don&apos;t build generic software. We build tools adapted to the
            specific economic realities of the world&apos;s fastest-growing markets.
          </p>
        </div>

        {/* Region Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {regions.map((region) => (
            <div
              key={region.name}
              className="rounded-xl border border-[#f1f5f9] bg-white p-8"
            >
              {/* Flag */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f8fafc]">
                <span className="text-[24px]">{region.flag}</span>
              </div>

              {/* Name */}
              <h3 className="mt-6 text-[20px] font-bold text-[#0f172a]">
                {region.name}
              </h3>

              {/* Description */}
              <p className="mt-2 text-[14px] font-medium leading-[20px] text-[#64748b]">
                {region.description}
              </p>

              {/* Stat */}
              <p className="mt-4 text-[24px] font-extrabold text-[#3c83f6]">
                {region.stat}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
