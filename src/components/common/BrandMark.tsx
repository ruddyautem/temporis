"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface BrandMarkProps {
  badge?: ReactNode;
}

const BrandMark = ({ badge }: BrandMarkProps) => {
  const t = useTranslations("Common");

  return (
    <div className='text-center space-y-1 sm:space-y-1.5 2xl:space-y-3 font-mono py-0 sm:py-0.5 2xl:py-2'>
      <div>
        <div className='relative inline-flex items-center gap-2 text-[9.5px] sm:text-[10px] 2xl:text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 2xl:px-4 2xl:py-1.5 rounded-none border border-emerald-500/25 bg-emerald-500/5'>
          {/* 4 crisp tactical cyber corners */}
          <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400 pointer-events-none' />
          <div className='absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-emerald-400 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-emerald-400 pointer-events-none' />
          <div className='absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-emerald-400 pointer-events-none' />

          {/* Tactical Encryption Icon */}
          <span className='flex items-center justify-center text-emerald-400'>
            <svg
              className='h-3 w-3 2xl:h-3.5 2xl:w-3.5 text-emerald-400'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2.2}
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='11' width='18' height='11' rx='0' ry='0' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
          </span>
          <span className='text-emerald-300 font-bold'>{t("badge")}</span>
        </div>
      </div>

      <div className='py-0 sm:py-0.5 2xl:py-1'>
        <h1 className='lobby-brand-title text-3xl sm:text-4xl md:text-5xl 2xl:text-7xl font-black tracking-tight text-white leading-none font-mono'>
          <span className='text-emerald-400'>{">"}</span>TEMPOR<span className='text-emerald-400'>IS</span>
        </h1>
      </div>

      <p className='lobby-brand-sub text-[9.5px] sm:text-[10px] 2xl:text-xs uppercase tracking-[0.22em] sm:tracking-[0.25em] text-slate-400 max-w-xs sm:max-w-md md:max-w-lg 2xl:max-w-2xl mx-auto leading-relaxed'>
        {t("subtitle")}
      </p>

      {badge && <div className='pt-0.5 sm:pt-1 2xl:pt-2'>{badge}</div>}
    </div>
  );
};

export default BrandMark;
