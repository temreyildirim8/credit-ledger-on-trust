"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, MessageCircle, MapPin, Send, ChevronDown } from "lucide-react";
import { toast } from "sonner";

/**
 * Contact Form Section - Matches Figma design
 * Lead Gen Form with contact info cards
 * https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4?node-id=11-1410
 */
export function ContactFormSection() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    subject: "general",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(t("form.success"));
    setFormData({ fullName: "", workEmail: "", subject: "general", message: "" });
    setLoading(false);
  };

  return (
    <section className="bg-[#f5f7f8] px-5 py-16 md:px-20 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-[64px]">
          {/* Left Side: Lead Gen Form */}
          <div className="flex-1">
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm md:p-10">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Full Name and Work Email row */}
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-[14px] font-bold text-[#334155]">
                      {t("form.fullName")}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                      className="h-12 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-[16px] text-[#0f172a] placeholder:text-[#6b7280] focus:border-[#3c83f6] focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/20"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-[14px] font-bold text-[#334155]">
                      {t("form.workEmail")}
                    </label>
                    <input
                      type="email"
                      value={formData.workEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, workEmail: e.target.value })
                      }
                      placeholder="john@company.com"
                      required
                      className="h-12 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-[16px] text-[#0f172a] placeholder:text-[#6b7280] focus:border-[#3c83f6] focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/20"
                    />
                  </div>
                </div>

                {/* Subject dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-[#334155]">
                    {t("form.subject")}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="h-12 w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-[16px] text-[#0f172a] focus:border-[#3c83f6] focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/20"
                    >
                      <option value="general">{t("form.subjects.general")}</option>
                      <option value="sales">{t("form.subjects.sales")}</option>
                      <option value="support">{t("form.subjects.support")}</option>
                      <option value="partnership">{t("form.subjects.partnership")}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]" />
                  </div>
                </div>

                {/* Message textarea */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-[#334155]">
                    {t("form.message")}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder={t("form.messagePlaceholder")}
                    required
                    rows={5}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-[16px] text-[#0f172a] placeholder:text-[#6b7280] focus:border-[#3c83f6] focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/20"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-2 rounded-lg bg-[#3c83f6] px-6 text-[16px] font-bold text-white shadow-[0px_20px_25px_-5px_rgba(60,131,246,0.1),0px_8px_10px_-6px_rgba(60,131,246,0.1)] transition-colors hover:bg-[#2563eb] disabled:opacity-70"
                >
                  {loading ? (
                    t("form.sending")
                  ) : (
                    <>
                      <span>{t("form.submit")}</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Privacy policy note */}
                <p className="text-center text-[12px] text-[#64748b]">
                  {t("form.privacyNote")}{" "}
                  <a href="/legal/privacy" className="underline hover:text-[#3c83f6]">
                    {t("form.privacyLink")}
                  </a>
                </p>
              </form>
            </div>
          </div>

          {/* Right Side: Contact Info Cards */}
          <div className="flex flex-1 flex-col gap-6">
            {/* Email Support Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(60,131,246,0.1)]">
                  <Mail className="h-6 w-6 text-[#3c83f6]" />
                </div>
                <div>
                  <h3 className="mb-1 text-[18px] font-bold text-[#0f172a]">
                    {t("info.email.title")}
                  </h3>
                  <p className="mb-2 text-[14px] text-[#64748b]">
                    {t("info.email.description")}
                  </p>
                  <a
                    href="mailto:support@globalledger.app"
                    className="text-[14px] font-medium text-[#3c83f6] hover:underline"
                  >
                    support@globalledger.app
                  </a>
                  <p className="mt-2 text-[12px] text-[#94a3b8]">
                    {t("info.email.responseTime")}
                  </p>
                </div>
              </div>
            </div>

            {/* Help Center Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(59,130,246,0.1)]">
                  <MessageCircle className="h-6 w-6 text-[#3b82f6]" />
                </div>
                <div>
                  <h3 className="mb-1 text-[18px] font-bold text-[#0f172a]">
                    {t("info.helpCenter.title")}
                  </h3>
                  <p className="mb-3 text-[14px] text-[#64748b]">
                    {t("info.helpCenter.description")}
                  </p>
                  <a
                    href="/help"
                    className="inline-flex items-center rounded-lg border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
                  >
                    {t("info.helpCenter.button")}
                  </a>
                </div>
              </div>
            </div>

            {/* Office Location Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.1)]">
                  <MapPin className="h-6 w-6 text-[#22c55e]" />
                </div>
                <div>
                  <h3 className="mb-1 text-[18px] font-bold text-[#0f172a]">
                    {t("info.office.title")}
                  </h3>
                  <p className="text-[14px] text-[#64748b]">
                    {t("info.office.company")}
                    <br />
                    {t("info.office.address")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
