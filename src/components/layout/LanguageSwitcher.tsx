"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const router = useRouter();

  function toggle() {
    const next = locale === "ro" ? "en" : "ro";
    setLocale(next);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border border-border hover:bg-muted transition-colors"
      title={locale === "ro" ? "Switch to English" : "Comută în Română"}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "ro" ? "EN" : "RO"}
    </button>
  );
}
