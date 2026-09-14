"use client";

import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("Common");
  const year = new Date().getFullYear();

  return (
    <footer className='w-full border-t border-emerald-500/20 bg-[#070e17]/95 backdrop-blur-xl h-7 sm:h-11 flex items-center justify-center font-mono select-none'>
      <div className='max-w-5xl mx-auto px-2 sm:px-6 flex items-center justify-center text-center'>
        <p className='text-slate-400 text-[8.5px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium leading-none m-0'>
          &copy; {year} {t("copyright")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
