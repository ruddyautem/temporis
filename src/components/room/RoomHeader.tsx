"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { Icon } from "@/components/Icons";

interface RoomHeaderProps {
  onCopyLink: () => void;
  onDestroy: () => void;
  isDestroying?: boolean;
}

const RoomHeader = ({
  onCopyLink,
  onDestroy,
  isDestroying,
}: RoomHeaderProps) => {
  const t = useTranslations("Room");

  return (
    <header className='relative border-b border-emerald-500/20 px-3 py-2 sm:px-6 sm:py-3 shrink-0 bg-[#070e17]/95 backdrop-blur-xl z-50 font-mono'>
      <div className='mx-auto flex items-center justify-between gap-2 relative max-w-5xl'>
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

        {/* Right: Action Buttons (Share, Destroy) + Language Switcher */}
        <div className='flex items-center gap-2 sm:gap-3 z-40'>
          {/* Share Button */}
          <button
            onClick={onCopyLink}
            title={t("share")}
            aria-label={t("share")}
            className='flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-emerald-500/30 bg-[#0c1624] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all active:scale-95 cursor-pointer h-[34px]'
          >
            <Icon name='share' className='w-3.5 h-3.5 text-emerald-400' />
            <span className='hidden sm:inline text-[10px] uppercase font-bold tracking-wider text-emerald-300'>
              {t("share")}
            </span>
          </button>

          {/* Destroy Button */}
          <button
            onClick={onDestroy}
            disabled={isDestroying}
            title={t("destroy")}
            aria-label={t("destroy")}
            className='flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-red-500/30 bg-[#160c10] text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:text-red-300 transition-all active:scale-95 disabled:opacity-40 cursor-pointer h-[34px] shadow-sm'
          >
            <Icon name='trash' className='w-3.5 h-3.5 text-red-400' />
            <span className='hidden sm:inline text-[10px] uppercase font-bold tracking-wider text-red-300'>
              {t("destroy")}
            </span>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher
            showFullText={true}
            buttonClassName='flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-emerald-500/30 bg-[#0c1624] text-slate-200 hover:bg-emerald-500/10 hover:border-emerald-400 transition-all cursor-pointer h-[34px] shadow-sm'
          />
        </div>
      </div>
    </header>
  );
};

export default RoomHeader;