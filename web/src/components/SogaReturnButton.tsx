"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const visitKey = "soga-portfolio-visit-v2";
let visitInThisTab: boolean | undefined;

function resolveEntry() {
  if (new URLSearchParams(window.location.search).get("soga_portfolio") === "1") return true;
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  let fromThisSite = false;
  try {
    fromThisSite = new URL(document.referrer).origin === window.location.origin;
  } catch {
    // Direct visits must not inherit a previous portfolio visit.
  }
  if (navigation?.type !== "reload" && !fromThisSite) return false;
  try {
    return sessionStorage.getItem(visitKey) === "1";
  } catch {
    return false;
  }
}

function readVisit() {
  return visitInThisTab ??= resolveEntry();
}

function observeVisit(listener: () => void) {
  if (readVisit()) {
    try {
      sessionStorage.setItem(visitKey, "1");
    } catch {
      // Retain the visit in memory if browser storage is blocked.
    }
  }
  if (!readVisit()) {
    try {
      sessionStorage.removeItem(visitKey);
    } catch {
      // The entry decision works without storage.
    }
  }
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

const readServerVisit = () => false;

export function SogaReturnButton() {
  const pathname = usePathname();
  const visited = useSyncExternalStore(observeVisit, readVisit, readServerVisit);
  if (!visited || pathname?.startsWith("/admin") || pathname?.startsWith("/liff")) return null;

  return (
    <a
      href="https://www.soga.ltd/#portfolio"
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-[#17212b] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#293b4d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17212b]"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      SOGAに戻る
    </a>
  );
}
