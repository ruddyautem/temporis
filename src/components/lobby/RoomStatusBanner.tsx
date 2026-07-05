interface RoomStatusBannerProps {
  status: { text: string; cls: string } | null;
}

const RoomStatusBanner = ({ status }: RoomStatusBannerProps) => {
  if (!status) return null;
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-current/20 bg-current/5 px-4 py-3 text-xs sm:text-sm ${status.cls}`}
    >
      <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse' />
      {status.text}
    </div>
  );
};

export default RoomStatusBanner;