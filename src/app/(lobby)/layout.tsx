import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import AppBackground from "@/components/common/AppBackground";

export default function RoomEntryLayout({ children }: { children: ReactNode }) {
  return (
    <main className='relative flex min-h-dvh flex-col bg-[#0d1621] text-slate-100 overflow-hidden selection:bg-emerald-500/20'>
      <AppBackground variant='grid' />
      <div className='relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12'>
        <div className='w-full max-w-sm sm:max-w-md md:max-w-lg space-y-6'>
          {children}
        </div>
      </div>
      <Footer />
    </main>
  );
}