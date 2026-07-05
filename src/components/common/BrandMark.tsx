import type { ReactNode } from "react";

interface BrandMarkProps {
  badge?: ReactNode;
}

const BrandMark = ({ badge }: BrandMarkProps) => (
  <div className='text-center space-y-3 md:space-y-4'>
    <h1 className='text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none'>
      <span className='text-emerald-400'>{">"}</span>
      Tempor<span className='text-emerald-400'>is</span>
    </h1>
    <p className='text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.35em] sm:tracking-[0.45em] text-slate-500'>
      Rooms éphémères · Zéro trace
    </p>
    {badge}
  </div>
);

export default BrandMark;
