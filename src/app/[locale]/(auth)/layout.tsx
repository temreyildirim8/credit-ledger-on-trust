import { Metadata } from 'next';

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

export default function AuthLayout({ children }: Props) {
  return <>{children}</>;
}
