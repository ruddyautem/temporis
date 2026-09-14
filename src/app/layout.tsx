import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import { DynamicIntlProvider, type SupportedLocale } from "@/components/common/DynamicIntlProvider";
import { Providers } from "@/components/Providers";
import ToastProvider from "@/components/ToastProvider";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TEMPORIS | Rooms éphémères",
  description: "Communication sécurisée et autodestructible",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as SupportedLocale;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${jetBrainsMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col bg-[#090f17] text-slate-100'>
        <DynamicIntlProvider initialLocale={locale} initialMessages={messages}>
          <Providers>{children}</Providers>
          <ToastProvider />
        </DynamicIntlProvider>
      </body>
    </html>
  );
}
