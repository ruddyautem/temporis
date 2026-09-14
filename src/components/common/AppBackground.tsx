interface AppBackgroundProps {
  /** "grid" adds the faint graph-paper overlay used on the room-entry screens. */
  variant?: "blur" | "grid";
}

const AppBackground = ({ variant = "blur" }: AppBackgroundProps) => (
  <div className='pointer-events-none absolute inset-0 overflow-hidden'>
    {/* Clean, deep neutral gradient */}
    <div className='absolute inset-0 bg-linear-to-b from-[#0e1724] via-[#090f17] to-[#060a10]' />

    {variant === "grid" && (
      <>
        {/* Subtle, clean technical grid overlay */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </>
    )}
  </div>
);

export default AppBackground;
