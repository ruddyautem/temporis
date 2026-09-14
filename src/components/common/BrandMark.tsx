"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface BrandMarkProps {
  badge?: ReactNode;
}

const BrandMark = ({ badge }: BrandMarkProps) => {
  const t = useTranslations("Common");

  return (
    <div className='text-center space-y-4 sm:space-y-5 font-mono py-2'>
      <div>
        <div className='relative inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-emerald-400 font-semibold px-3.5 py-1.5 rounded-none border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'>
          {/* 4 crisp tactical cyber corners */}
          <div className='absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-emerald-400 pointer-events-none' />
          <div className='absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-emerald-400 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-emerald-400 pointer-events-none' />
          <div className='absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-emerald-400 pointer-events-none' />

          {/* Tactical Encryption Icon */}
          <span className='flex items-center justify-center text-emerald-400'>
            <svg
              className='h-3 w-3 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]'
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

      <div className='py-1 sm:py-2'>
        <h1 className='text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-none font-mono'>
          <span className='text-emerald-400'>{">"}</span>TEMPOR<span className='text-emerald-400'>IS</span>
        </h1>
      </div>

      <p className='text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-400 max-w-sm sm:max-w-md mx-auto leading-relaxed'>
        {t("subtitle")}
      </p>

      {badge && <div className='pt-2'>{badge}</div>}
    </div>
  );
};

export default BrandMark;
