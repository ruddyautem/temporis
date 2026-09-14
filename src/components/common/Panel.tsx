import type { ReactNode } from "react";

const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`relative rounded-none border border-emerald-500/25 bg-[#0c1522]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden ${className}`}
  >
    {/* Tactical Corner Accents */}
    <div className='absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-400/80 z-10 pointer-events-none' />
    <div className='absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-400/80 z-10 pointer-events-none' />
    <div className='absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-400/80 z-10 pointer-events-none' />
    <div className='absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-400/80 z-10 pointer-events-none' />
    {children}
  </div>
);

export default Panel;