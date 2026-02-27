import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/routing";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations } from "next-intl";

interface CheckoutButtonProps {
  plan: "free" | "pro" | "enterprise";
  featured?: boolean;
  interval?: "monthly" | "yearly";
  children: React.ReactNode;
}

export function CheckoutButton({
  plan,
  featured,
  interval = "monthly",
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const t = useTranslations("pricing");

  const handleClick = async () => {
    // If not logged in, redirect to login
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Free plan - redirect to signup or show message
    if (plan === "free") {
      window.location.href = "/signup";
      return;
    }

    // Enterprise - contact sales
    if (plan === "enterprise") {
      window.location.href = "/contact";
      return;
    }

    // Paid plan - initiate Stripe checkout
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          interval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("checkoutError"));
    } finally {
      setIsLoading(false);
    }
  };

  // For non-authenticated users or free plan, show link
  if (!user || plan === "free") {
    return (
      <Link
        href={plan === "free" ? "/signup" : "/login"}
        className="block w-full"
      >
        <Button
          className={`w-full ${
            featured
              ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
              : ""
          }`}
          variant={featured ? "default" : "outline"}
        >
          {children}
        </Button>
      </Link>
    );
  }

  // For authenticated users with paid plans, show checkout button
  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full ${
        featured
          ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
          : ""
      }`}
      variant={featured ? "default" : "outline"}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingCheckout")}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
