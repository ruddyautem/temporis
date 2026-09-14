import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import AppBackground from "@/components/common/AppBackground";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export default function RoomEntryLayout({ children }: { children: ReactNode }) {
  return (
    <main className='relative flex min-h-dvh flex-col justify-between bg-[#0b121b] text-slate-100 overflow-x-hidden selection:bg-emerald-500/20 font-mono'>
      <AppBackground variant='grid' />

      {/* Top Header Bar matching Chat RoomHeader style with high z-index so dropdown floats above everything */}
      <header className='relative border-b border-emerald-500/20 px-3 py-2 sm:px-6 sm:py-3 shrink-0 bg-[#070e17]/95 backdrop-blur-xl z-50 font-mono'>
        <div className='mx-auto flex items-center justify-between gap-2 relative max-w-5xl'>
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
              className='h-5 w-5 drop-shadow-[0_0_8px_rgba(0,212,146,0.6)]'
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
              buttonClassName='flex items-center justify-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 bg-[#0c1624] text-slate-200 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer h-[34px] shadow-sm'
            />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className='relative z-20 flex flex-1 flex-col items-center justify-start sm:justify-center px-4 pt-2.5 sm:pt-6 pb-2 sm:py-10 w-full'>
        <div className='w-full max-w-sm sm:max-w-md md:max-w-lg flex-1 sm:flex-initial flex flex-col space-y-3 sm:space-y-6'>
          {children}
        </div>
      </div>

      {/* Footer on both mobile and desktop: sticks directly under the container on mobile */}
      <div className='w-full mt-2 sm:mt-auto relative z-10 pb-20 sm:pb-0'>
        <Footer />
      </div>
    </main>
  );
}