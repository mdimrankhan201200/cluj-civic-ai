"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale, type Translations } from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "ro",
  t: translations.ro,
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ro");

  useEffect(() => {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith("locale="));
    const val = match?.split("=")?.[1]?.trim();
    if (val === "en" || val === "ro") setLocaleState(val);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    setLocaleState(next);
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
