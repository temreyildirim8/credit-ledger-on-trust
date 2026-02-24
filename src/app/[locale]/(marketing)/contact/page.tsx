'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, MessageCircle, Send, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success(t('success'));
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-white/90">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold font-display text-[var(--color-text)] mb-6">
                  {t('form.title')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('form.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('form.subject')}</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('form.message')}</Label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                    disabled={loading}
                  >
                    {loading ? (
                      t('form.sending')
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t('form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-[var(--color-border)]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)] mb-1">Email</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm mb-2">
                        {t('info.email')}{' '}
                        <a href={`mailto:${t('info.emailAddress')}`} className="text-[var(--color-accent)] hover:underline">
                          {t('info.emailAddress')}
                        </a>
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t('info.responseTime')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--color-border)]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)] mb-1">{t('info.liveChat.title')}</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">
                        {t('info.liveChat.description')}
                      </p>
                      <Button variant="outline" className="mt-3" size="sm">
                        {t('info.liveChat.button')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--color-border)]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)] mb-1">{t('info.office.title')}</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">
                        {t('info.office.company')}<br />
                        {t('info.office.address')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-white/90 mb-8">
            {t('cta.description')}
          </p>
          <Button
            size="lg"
            className="bg-white text-[var(--color-accent)] hover:bg-white/90"
          >
            {t('cta.button')}
          </Button>
        </div>
      </section>
    </div>
  );
}
