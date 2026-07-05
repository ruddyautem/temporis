import { Fragment } from "react";
import { Icon } from "@/components/Icons";
import { TRUST_FEATURES } from "@/lib/room-config";

const TrustBadges = () => (
  <div className='flex items-center justify-center gap-3 sm:gap-5 flex-wrap px-2'>
    {TRUST_FEATURES.map((feature, i) => (
      <Fragment key={feature.label}>
        <span className='flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-wider text-slate-600'>
          <Icon name={feature.icon} />
          {feature.label}
        </span>
        {i < TRUST_FEATURES.length - 1 && (
          <span className='hidden sm:block h-3 w-px bg-slate-700/80' />
        )}
      </Fragment>
    ))}
  </div>
);

export default TrustBadges;
