import { redirect } from 'next/navigation';
import { routing } from '@/routing';

/**
 * Help Center page - Redirects to contact page
 * TODO: Create a dedicated help center with FAQs and documentation
 */
export default function HelpPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || routing.defaultLocale;
  redirect(`/${locale}/contact`);
}
