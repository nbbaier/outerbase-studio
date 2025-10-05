"use client";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useEffect } from "react";
import PageTracker from "@/components/page-tracker";
import { Toaster } from "@/components/ui/sonner";

export default function ThemeLayout({
  children,
  overrideTheme,
  overrideThemeVariables,
}: PropsWithChildren<{
  overrideTheme?: "dark" | "light";
  overrideThemeVariables?: Record<string, string>;
}>) {
  useEffect(() => {
    if (overrideThemeVariables && typeof window === "undefined") {
      Object.entries(overrideThemeVariables).forEach(([key, value]) => {
        document.body.style.setProperty(key, value);
      });
    }
  }, [overrideThemeVariables]);

  return (
    <>
      <ThemeProvider
        forcedTheme={overrideTheme}
        enableColorScheme
        attribute="class"
      >
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </ThemeProvider>
      <PageTracker />
      <Script async defer src="https://buttons.github.io/buttons.js" />
    </>
  );
}
