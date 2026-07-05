import Button from "@/components/common/Button";

interface LeaveConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LeaveConfirmDialog = ({ onConfirm, onCancel }: LeaveConfirmDialogProps) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm font-mono'>
    <div className='mx-4 w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0d1621] p-6 shadow-2xl'>
      <div className='mb-4 flex justify-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10'>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-6 w-6 text-red-500'>
            <path
              fillRule='evenodd'
              d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      </div>

      <p className='mb-1 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500'>Attention</p>
      <h2 className='mb-2 text-center text-[15px] font-bold uppercase tracking-widest text-slate-100'>
        Quitter la session ?
      </h2>
      <p className='mb-6 text-center text-[11px] leading-relaxed text-slate-400'>
        Vous êtes <span className='font-bold text-red-400'>seul dans cette room</span>. Si vous partez,
        elle sera <span className='font-bold text-red-400'>définitivement détruite</span> et tous les
        messages effacés.
      </p>

      <div className='flex flex-col gap-2'>
        <Button variant='danger' onClick={onConfirm}>
          Quitter et détruire
        </Button>
        <Button variant='ghost' onClick={onCancel}>
          Rester
        </Button>
      </div>
    </div>
  </div>
);

export default LeaveConfirmDialog;