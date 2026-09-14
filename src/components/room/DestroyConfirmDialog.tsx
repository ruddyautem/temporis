"use client";

import { useTranslations } from "next-intl";

interface DestroyConfirmDialogProps {
  isOpen: boolean;
  isDestroying?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DestroyConfirmDialog = ({
  isOpen,
  isDestroying = false,
  onConfirm,
  onCancel,
}: DestroyConfirmDialogProps) => {
  const t = useTranslations("Room");

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono p-4'>
      {/* Cyber terminal container with green border, subtle green glow and deep tinted dark green bg */}
      <div className='relative w-full max-w-md rounded-none border border-emerald-500/40 bg-[#09151e]/95 p-6 sm:p-7 shadow-[0_0_40px_rgba(16,185,129,0.15)]'>
        {/* The 4 green tactical corner notches */}
        <div className='absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400 z-10 pointer-events-none' />
        <div className='absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400 z-10 pointer-events-none' />
        <div className='absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400 z-10 pointer-events-none' />
        <div className='absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400 z-10 pointer-events-none' />

        {/* Top Header Badge */}
        <div className='mb-4 flex items-center justify-center'>
          <div className='flex items-center gap-2 px-3 py-1 border border-red-500/40 bg-red-500/10 text-red-400 text-[10px] uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.15)]'>
            <span className='inline-block w-1.5 h-1.5 bg-red-400 animate-pulse' />
            <span>{t("destroyModalTitle")}</span>
          </div>
        </div>

        {/* Clean crisp white headline */}
        <h2 className='mb-3 text-center text-[15px] sm:text-[16px] font-bold tracking-wide text-white'>
          {t("destroyModalTitle")}
        </h2>

        {/* Description */}
        <p className='mb-6 text-center text-xs sm:text-[13px] leading-relaxed text-slate-200 font-mono'>
          {t("destroyModalDesc")}
        </p>

        {/* Action buttons */}
        <div className='flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isDestroying}
            className='w-full sm:flex-1 py-2.5 px-4 rounded-none border border-slate-700/80 bg-[#0c1622] text-slate-300 hover:text-white hover:border-slate-500 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer'
          >
            {t("destroyCancel")}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isDestroying}
            className='w-full sm:flex-1 py-2.5 px-4 rounded-none border border-red-500/80 bg-red-600 hover:bg-red-500 text-white transition-all font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-40 cursor-pointer active:scale-95'
          >
            {isDestroying ? "..." : t("destroyConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestroyConfirmDialog;