"use client";

import { useTransition, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function isRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function BillingActionButton({
  action,
  disabled,
  variant,
  children,
}: {
  action: () => Promise<void>;
  disabled?: boolean;
  variant?: ComponentProps<typeof Button>["variant"];
  children: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        // A successful redirect() throws a special NEXT_REDIRECT error to
        // hand control back to Next.js's navigation — must not be swallowed.
        if (isRedirectError(error)) throw error;
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  return (
    <Button variant={variant} disabled={disabled || isPending} onClick={handleClick}>
      {isPending ? "Loading…" : children}
    </Button>
  );
}
