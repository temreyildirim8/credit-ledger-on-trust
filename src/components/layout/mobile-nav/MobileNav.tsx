'use client';

import { usePathname } from "@/routing";
import { Link } from "@/routing";
import { useTranslations } from 'next-intl';
import { Home, Users, Receipt, PlusCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, key: 'dashboard' },
  { href: '/customers', icon: Users, key: 'customers' },
  { href: '/quick-add', icon: PlusCircle, key: 'quickAdd' },
  { href: '/transactions', icon: Receipt, key: 'transactions' },
  { href: '/settings', icon: Settings, key: 'settings' },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === `${basePath}${item.href}`;

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
              <span className="text-xs mt-1">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
