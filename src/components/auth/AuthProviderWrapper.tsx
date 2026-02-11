"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/useAuth";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides auth context to the app
 * Must be a client component because it uses useState for auth state
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
