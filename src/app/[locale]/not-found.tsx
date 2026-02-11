"use client";

import { useTranslations } from 'next-intl'
import { Link } from '@/routing'
import { Home, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--color-bg)] relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Large 404 */}
        <div className="mb-8">
          <h1 className="text-[clamp(120px,20vw,280px)] font-display font-bold leading-none tracking-tighter">
            <span className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] bg-clip-text text-transparent">
              404
            </span>
          </h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-[var(--color-text)] mb-4">
          {t('title')}
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)] mb-12 max-w-md mx-auto">
          {t('description')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 h-12 text-base font-semibold cursor-pointer transition-all duration-200"
          >
            <Link href="/">
              <Home className="w-5 h-5" />
              {t('goHome')}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] px-8 h-12 text-base font-semibold cursor-pointer transition-all duration-200"
          >
            <Link href="/contact">
              <Mail className="w-5 h-5" />
              {t('contactSupport')}
            </Link>
          </Button>
        </div>

        {/* Go back link */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  )
}
