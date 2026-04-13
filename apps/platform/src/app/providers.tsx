"use client";

import { SessionProvider } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { ConsentProvider } from "@/lib/consent/ConsentContext";
import { SessionGuard } from "@/components/SessionGuard";
import { dispatchSessionInvalid } from "@/lib/api/client";
import { useState, useEffect, type ReactNode } from "react";

function ScrollRevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const observe = () => {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (!el.classList.contains("visible")) observer.observe(el);
      });
    };

    observe();

    const mutation = new MutationObserver(observe);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    function on401(error: unknown) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as Error & { status: number }).status === 401
      ) {
        dispatchSessionInvalid();
      }
    }
    return new QueryClient({
      queryCache: new QueryCache({ onError: on401 }),
      mutationCache: new MutationCache({ onError: on401 }),
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: (failureCount, error) => {
            // Never retry 401s — session is invalid, not a transient failure.
            if (
              error instanceof Error &&
              "status" in error &&
              (error as Error & { status: number }).status === 401
            ) {
              return false;
            }
            return failureCount < 1;
          },
        },
      },
    });
  });

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ConsentProvider>
          <TooltipProvider>
            <SessionGuard />
            <ScrollRevealObserver />
            {children}
            <CookieBanner />
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ConsentProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
