"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { SubscriptionProvider } from "@/lib/hooks/useSubscription";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides auth and subscription context to the app
 * Must be a client component because it uses useState for auth state
 * SubscriptionProvider is nested inside AuthProvider since it depends on useAuth
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </AuthProvider>
  );
}
