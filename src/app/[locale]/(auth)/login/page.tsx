"use client";

import { useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "en";

  console.log("[LoginPage] Auth state:", {
    loading,
    userId: user?.id,
    hasUser: !!user,
  });

  // NOTE: Redirect is handled by LoginForm after successful sign in
  // We don't redirect here to avoid timing issues with auth state updates

  // Show loader while checking auth
  if (loading) {
    console.log("[LoginPage] Loading, showing spinner");
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Don't render the form if already authenticated (redirect in progress)
  if (user) {
    console.log(
      "[LoginPage] User authenticated, returning null (redirect in progress)",
    );
    return null;
  }

  console.log("[LoginPage] Rendering LoginForm");
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <LoginForm />
    </div>
  );
}
