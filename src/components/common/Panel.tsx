import type { ReactNode } from "react";

const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export default Panel;