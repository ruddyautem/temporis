"use client";

import { Icon } from "@/components/Icons";
import BrandMark from "@/components/common/BrandMark";
import TrustBadges from "@/components/common/TrustBadges";
import Panel from "@/components/common/Panel";
import Button from "@/components/common/Button";

interface JoinScreenProps {
  username: string;
  roomId: string;
  onJoin: () => void;
  onDecline: () => void;
}

const JoinScreen = ({ username, roomId, onJoin, onDecline }: JoinScreenProps) => (
  <>
    <BrandMark
      badge={
        <div className='inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[11px] md:text-xs font-medium uppercase tracking-widest text-emerald-400'>
          <Icon name='shield' />
          <span>Invitation reçue</span>
        </div>
      }
    />

    <Panel>
      <div className='border-b border-slate-700/50 bg-[#060d14]/60 px-4 py-4 sm:px-6 sm:py-5 text-center'>
        <div className='flex items-center justify-center gap-2 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-widest text-emerald-400/80'>
          <Icon name='lock' />
          <span>Vous avez été invité à rejoindre cette conversation</span>
        </div>
      </div>

      <div className='p-5 sm:p-7 md:p-10 space-y-7 sm:space-y-8 md:space-y-9'>
        <div className='space-y-3'>
          <p className='text-center text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-slate-500'>
            Votre identité anonyme
          </p>
          <div className='flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-[#0a1118] p-4 sm:p-5 md:p-6'>
            <span className='font-mono text-base md:text-lg font-bold text-emerald-200/90 break-all'>
              {username}
            </span>
            <span className='h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' />
          </div>
          <p className='text-center text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500'>
            Session <span className='font-mono text-emerald-400/80'>{roomId}</span>
          </p>
        </div>

        <div className='flex gap-2 sm:gap-4'>
          <Button variant='primary' onClick={onJoin} className='flex-1'>
            Rejoindre<br className='sm:hidden' /> la room
          </Button>
          <Button variant='danger' onClick={onDecline} className='flex-1'>
            Retour<br className='sm:hidden' /> à l'accueil
          </Button>
        </div>
      </div>
    </Panel>

    <TrustBadges />
  </>
);

export default JoinScreen;