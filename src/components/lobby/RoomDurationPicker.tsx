import { Icon } from "@/components/Icons";
import { TTL_OPTIONS, type RoomTtlMinutes } from "@/lib/room-config";

interface RoomDurationPickerProps {
  value: RoomTtlMinutes | undefined;
  onChange: (minutes: RoomTtlMinutes) => void;
  disabled?: boolean;
}

const RoomDurationPicker = ({
  value,
  onChange,
  disabled,
}: RoomDurationPickerProps) => (
  <div>
    <div className='mb-4 sm:mb-5 flex items-center gap-3'>
      <div className='h-px flex-1 bg-slate-700/60' />
      <span className='text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap'>
        Durée de vie de la room
      </span>
      <div className='h-px flex-1 bg-slate-700/60' />
    </div>

    <div className='grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4'>
      {TTL_OPTIONS.map((minutes) => {
        const active = value === minutes;
        return (
          <button
            key={minutes}
            onClick={() => onChange(minutes)}
            disabled={disabled}
            className={`group relative rounded-xl border py-5 sm:py-6 text-center transition-all duration-200 cursor-pointer ${
              active
                ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                : "border-slate-700/60 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60"
            }`}
          >
            <span
              className={`block text-2xl sm:text-3xl md:text-4xl font-black tabular-nums leading-none ${active ? "text-emerald-300" : "text-slate-300"}`}
            >
              {minutes}
            </span>
            <span
              className={`mt-1.5 sm:mt-2 block text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.3em] ${active ? "text-emerald-500/70" : "text-slate-600"}`}
            >
              min
            </span>
            {active && (
              <span className='absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex h-1.5 w-1.5 rounded-full bg-emerald-500' />
            )}
          </button>
        );
      })}
    </div>

    <div className='mt-4 sm:mt-5'>
      {value ? (
        <div className='space-y-2'>
          <p className='text-center text-[10px] sm:text-[11px] md:text-xs text-slate-500'>
            La room s'autodétruira{" "}
            <span className='text-emerald-400/80 font-medium'>
              {value} minutes
            </span>{" "}
            après sa création
          </p>
          <div className='flex items-center justify-center gap-2 text-[9px] sm:text-[10px] md:text-[11px] text-slate-600'>
            <Icon name='trash' />
            <span>Aucun historique n'est conservé</span>
          </div>
        </div>
      ) : (
        <p className='text-center text-[10px] sm:text-[11px] md:text-xs text-slate-600'>
          Sélectionnez une durée pour créer votre room sécurisée
        </p>
      )}
    </div>
  </div>
);

export default RoomDurationPicker;
