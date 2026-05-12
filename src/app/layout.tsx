import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TEMPORIS | Rooms éphémères",
  description: "Communication sécurisée et autodestructible",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${jetBrainsMono.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <Providers>{children}</Providers>
        <ToastContainer
          position='top-center'
          theme='dark'
          hideProgressBar={false}
          autoClose={2000}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          transition={Zoom}
          toastClassName='border border-slate-800 bg-[#0c1620] text-slate-100 font-mono text-[10px] uppercase tracking-wider'
          progressClassName='bg-emerald-500'
        />
      </body>
    </html>
  );
}
