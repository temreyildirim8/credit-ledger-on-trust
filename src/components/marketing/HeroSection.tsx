import { Link } from "@/routing";
import { ArrowRight, Shield, Zap, Smartphone } from "lucide-react";

/**
 * Hero section - Large headline, subtitle, CTAs, and floating stat cards
 */
export function HeroSection() {

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                <Zap className="h-4 w-4" />
                <span>Works 100% Offline • No Internet Needed</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Money for Here,
                <br />
                <span className="text-white/90">There & Everywhere</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/80 max-w-lg">
                Replace your paper credit notebook with a digital ledger that speaks your language,
                knows your currency, and never loses your data.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                Start Free Today
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 border border-white/30"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <span>Works Offline</span>
              </div>
            </div>
          </div>

          {/* Visual - Floating stat cards */}
          <div className="relative h-[400px] hidden lg:block">
            {/* Main floating card */}
            <div className="absolute top-10 left-10 bg-white rounded-2xl shadow-2xl p-6 w-64 animate-float">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Debt</p>
                  <p className="text-2xl font-bold text-gray-900">₺12,450</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-full" />
              </div>
              <p className="text-xs text-gray-500 mt-2">75% collected this month</p>
            </div>

            {/* Secondary card */}
            <div className="absolute top-32 right-0 bg-white rounded-2xl shadow-2xl p-5 w-56 animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">✓</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="text-lg font-bold text-green-600">+₺850</p>
                </div>
              </div>
            </div>

            {/* Third card */}
            <div className="absolute bottom-10 left-20 bg-white rounded-2xl shadow-2xl p-5 w-60 animate-float-delayed-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customers</p>
                  <p className="text-lg font-bold text-gray-900">47 Active</p>
                </div>
              </div>
            </div>

            {/* Encrypted badge */}
            <div className="absolute bottom-0 right-10 bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
              <Shield className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Encrypted</p>
                <p className="text-sm font-semibold">AES-256</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
