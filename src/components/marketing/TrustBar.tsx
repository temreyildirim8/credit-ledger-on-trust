import { Shield, Users, Clock } from "lucide-react";

/**
 * Trust bar - Social proof and reliability indicators
 * Figma: Light background, blue accents, centered stats
 */
export function TrustBar() {
  const stats = [
    {
      icon: Users,
      value: "300,000+",
      label: "Active Users",
    },
    {
      icon: Shield,
      value: "Bank-Grade",
      label: "Security",
    },
    {
      icon: Clock,
      value: "99.9%",
      label: "Uptime",
    },
  ];

  return (
    <section className="bg-white px-5 py-16 md:py-24 md:px-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs md:text-sm font-semibold text-[#3c83f6] uppercase tracking-wide mb-2">
            Trusted by businesses small and large
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0f172a]">
            Join thousands of shop owners worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#f8fafc] shadow-md mb-3 md:mb-4">
                  <Icon className="h-6 w-6 md:h-7 md:w-7 text-[#3c83f6]" />
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0f172a] mb-1">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-[#64748b]">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
