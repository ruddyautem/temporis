"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  ReactNode,
} from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

export type SupportedLocale = "fr" | "en";

const ALL_MESSAGES: Record<SupportedLocale, typeof frMessages> = {
  fr: frMessages,
  en: enMessages,
};

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  setLocale: () => {},
});

export const useAppLocale = () => useContext(I18nContext);

export function DynamicIntlProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale: SupportedLocale;
  initialMessages: AbstractIntlMessages;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(
    initialMessages || ALL_MESSAGES[initialLocale] || frMessages
  );
  const [, startTransition] = useTransition();

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    // 1. Update document cookie for persistence across sessions & SSR
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }

    // 2. Instant zero-lag state switch
    startTransition(() => {
      setLocaleState(newLocale);
      setMessages(ALL_MESSAGES[newLocale]);
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone='UTC'>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
