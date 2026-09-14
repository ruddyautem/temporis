import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import AppBackground from "@/components/common/AppBackground";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export default function RoomEntryLayout({ children }: { children: ReactNode }) {
  return (
    <main className='relative flex min-h-dvh sm:h-dvh sm:max-h-dvh flex-col bg-[#0b121b] text-slate-100 overflow-x-hidden sm:overflow-hidden selection:bg-emerald-500/20 font-mono'>
      <AppBackground variant='grid' />

      {/* Top Header Bar matching Chat RoomHeader style with high z-index so dropdown floats above everything */}
      <header className='relative border-b border-emerald-500/20 px-3 py-2 sm:px-6 sm:py-2.5 shrink-0 bg-[#070e17]/95 backdrop-blur-xl z-50 font-mono'>
        <div className='mx-auto flex items-center justify-between gap-2 relative max-w-6xl'>
          {/* Left: Temporis Logo / Brand with favicon svg */}
          <Link
            href='/'
            className='flex items-center gap-2 text-xs hover:opacity-90 transition-opacity z-10'
          >
            <Image
              src='/icon.svg'
              alt='Temporis'
              width={20}
              height={20}
              className='h-5 w-5 drop-shadow-[0_0_6px_rgba(0,212,146,0.5)]'
              priority
            />
            <span className='font-bold text-white tracking-widest uppercase text-xs sm:text-sm'>
              TEMPOR<span className='text-emerald-400'>IS</span>
            </span>
          </Link>

          {/* Right: Language Switcher in full letters */}
          <div className='flex items-center z-50'>
            <LanguageSwitcher
              showFullText={true}
              buttonClassName='flex items-center justify-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 bg-[#0c1624] text-slate-200 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer h-[32px] shadow-sm'
            />
          </div>
        </div>
      </header>

      {/* Page Content: full available height on mobile, cleanly centered and viewport-fitted on desktop */}
      <div className='relative z-20 flex flex-1 min-h-0 flex-col items-center justify-center px-3 sm:px-6 md:px-8 lg:px-10 2xl:px-16 py-2 sm:py-3 md:py-5 2xl:py-8 w-full sm:overflow-hidden'>
        <div className='w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-6xl flex flex-col flex-1 min-h-0 justify-center space-y-2 sm:space-y-3 md:space-y-4 2xl:space-y-8 sm:my-auto'>
          {children}
        </div>
      </div>

      {/* Footer on both mobile and desktop */}
      <div className='w-full sm:mt-auto relative z-10 pb-20 sm:pb-0 shrink-0'>
        <Footer />
      </div>
    </main>
  );
}