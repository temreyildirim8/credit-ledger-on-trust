'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Receipt, PlusCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/customers', icon: Users, label: 'Müşteriler' },
  { href: '/quick-add', icon: PlusCircle, label: 'Ekle' },
  { href: '/transactions', icon: Receipt, label: 'İşlemler' },
  { href: '/settings', icon: Settings, label: 'Ayarlar' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.includes(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-12 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
