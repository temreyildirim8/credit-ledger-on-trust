import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us',
    description: 'Get in touch with Global Ledger support. We offer email support, live chat, and office visits. Contact us for sales inquiries, technical support, or partnership opportunities.',
    openGraph: {
      title: 'Contact Us - Global Ledger',
      description: 'Get in touch with Global Ledger support. We offer email support, live chat, and office visits.',
      url: '/contact',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Us - Global Ledger',
      description: 'Get in touch with Global Ledger support.',
    },
  };
}

type Props = {
  children: React.ReactNode;
};

export default function ContactLayout({ children }: Props) {
  return <>{children}</>;
}
