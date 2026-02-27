"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { SubscriptionProvider } from "@/lib/hooks/useSubscription";
import { QueryProvider } from "@/lib/query-provider";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all context providers for the app
 * Order matters: QueryProvider > AuthProvider > SubscriptionProvider
 * - QueryProvider must be at the top for React Query to work
 * - AuthProvider provides user authentication state
 * - SubscriptionProvider depends on useAuth
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
