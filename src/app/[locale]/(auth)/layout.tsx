import { Metadata } from 'next';
import { ForceLightTheme } from '@/components/theme/ForceLightTheme';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type Props = {
  children: React.ReactNode;
};

/**
 * Auth Layout - Login, Signup, Forgot Password pages
 * Forces light theme for consistent auth experience
 * Dark mode is only available on app pages
 */
export default function AuthLayout({ children }: Props) {
  return <ForceLightTheme>{children}</ForceLightTheme>;
}
