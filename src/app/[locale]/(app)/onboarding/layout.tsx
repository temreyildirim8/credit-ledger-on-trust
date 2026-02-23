'use client';

import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
