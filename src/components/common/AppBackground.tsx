interface AppBackgroundProps {
  /** "grid" adds the faint graph-paper overlay used on the room-entry screens. */
  variant?: "blur" | "grid";
}

const AppBackground = ({ variant = "blur" }: AppBackgroundProps) => (
  <div className='pointer-events-none absolute inset-0 overflow-hidden'>
    <div className='absolute -top-32 -left-32 w-125 h-125 rounded-full bg-emerald-500/5 blur-[120px]' />
    <div className='absolute -bottom-32 -right-32 w-125 h-125 rounded-full bg-emerald-600/5 blur-[120px]' />
    {variant === "grid" && (
      <div
        className='absolute inset-0 opacity-[0.03]'
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    )}
  </div>
);

export default AppBackground;
