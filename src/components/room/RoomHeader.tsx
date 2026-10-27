"use client";

import Image from "next/image";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const RoomHeader = () => {
  return (
    <header className='room-header relative border-b border-emerald-500/20 px-3 py-2 sm:px-6 sm:py-3 shrink-0 bg-[#070e17]/95 backdrop-blur-xl z-50 font-mono'>
      <div className='room-header-inner mx-auto flex items-center justify-between gap-2 relative max-w-5xl'>
        {/* Left: Temporis Logo */}
        <div className='flex items-center gap-2 text-xs select-none z-10'>
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
        </div>

        <div className='flex items-center gap-2 sm:gap-3 z-40'>
          {/* Language Switcher */}
          <LanguageSwitcher
            showFullText={true}
            buttonClassName='flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-emerald-500/30 bg-[#0c1624] text-slate-200 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer h-8.5 shadow-sm'
          />
        </div>
      </div>
    </header>
  );
};

export default RoomHeader;
