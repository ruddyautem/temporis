import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='fr' className={`${jetBrainsMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col bg-[#0d1621]'>
        <Providers>{children}</Providers>
        <ToastProvider />
      </body>
    </html>
  );
}
