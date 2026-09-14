"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/common/Button";

interface LeaveConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LeaveConfirmDialog = ({ onConfirm, onCancel }: LeaveConfirmDialogProps) => {
  const t = useTranslations("Room");

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm font-mono'>
      <div className='relative mx-4 w-full max-w-sm rounded-none border border-red-500/40 bg-[#0d1622] p-6 shadow-2xl'>
        {/* Tactical Corner Accents */}
        <div className='absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500 z-10 pointer-events-none' />
        <div className='absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500 z-10 pointer-events-none' />
        <div className='absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500 z-10 pointer-events-none' />
        <div className='absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500 z-10 pointer-events-none' />

        <div className='mb-4 flex justify-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-none border border-red-500/40 bg-red-500/10'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-6 w-6 text-red-500'>
              <path
                fillRule='evenodd'
                d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>

        <p className='mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-slate-400 font-semibold'>
          {t("leaveModalWarning")}
        </p>
        <h2 className='mb-2 text-center text-[15px] font-bold uppercase tracking-wider text-slate-100'>
          {t("leaveModalTitle")}
        </h2>
        <p className='mb-6 text-center text-[11px] leading-relaxed text-slate-300'>
          {t("leaveModalDesc")}
        </p>

        <div className='flex flex-col gap-2'>
          <Button variant='danger' onClick={onConfirm}>
            {t("leaveConfirm")}
          </Button>
          <Button variant='ghost' onClick={onCancel}>
            {t("leaveCancel")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveConfirmDialog;