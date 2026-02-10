'use client';

import { useTranslations } from 'next-intl';

/**
 * Hook for getting translations in client components
 * Usage: const t = useTranslations('namespace');
 */
export function useClientTranslations(namespace?: string) {
  return useTranslations(namespace);
}

/**
 * Type-safe translation hook for specific namespaces
 */
export function useAppTranslations() {
  const t = useTranslations();

  return {
    // Common
    common: {
      back: t('common.back'),
      save: t('common.save'),
      cancel: t('common.cancel'),
      delete: t('common.delete'),
      edit: t('common.edit'),
      add: t('common.add'),
      search: t('common.search'),
      loading: t('common.loading'),
      noResults: t('common.noResults'),
    },
    // Navigation
    nav: {
      dashboard: t('nav.dashboard'),
      customers: t('nav.customers'),
      transactions: t('nav.transactions'),
      quickAdd: t('nav.quickAdd'),
      settings: t('nav.settings'),
      login: t('nav.login'),
      signup: t('nav.signup'),
    },
  };
}
