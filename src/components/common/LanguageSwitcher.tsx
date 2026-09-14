"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Icons";

import { useAppLocale, type SupportedLocale } from "./DynamicIntlProvider";

const FlagFR = ({ className = "w-4 h-3 shrink-0" }: { className?: string }) => (
  <svg
    viewBox='0 0 640 480'
    className={`${className} rounded-[1px] shadow-sm inline-block`}
    aria-hidden='true'
  >
    <g fillRule='evenodd' strokeWidth='1pt'>
      <path fill='#fff' d='M0 0h640v480H0z' />
      <path fill='#00267f' d='M0 0h213.3v480H0z' />
      <path fill='#f31830' d='M426.7 0H640v480H426.7z' />
    </g>
  </svg>
);

const FlagGB = ({ className = "w-4 h-3 shrink-0" }: { className?: string }) => (
  <svg
    viewBox='0 0 640 480'
    className={`${className} rounded-[1px] shadow-sm inline-block`}
    aria-hidden='true'
  >
    <path fill='#012169' d='M0 0h640v480H0z' />
    <path
      fill='#FFF'
      d='m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-179L0 64V0h75z'
    />
    <path
      fill='#C8102E'
      d='m424 288 216 159v33h-44L380 320l44-32zM640 0v10L454 150l36 29L640 60V0zm-416 30 2 33-186 137H0v-10l186-138 38-22zm-40 130L0 34v-34h40l200 148-56 12z'
    />
    <path fill='#FFF' d='M240 0h160v480H240zM0 160h640v160H0z' />
    <path fill='#C8102E' d='M266 0h108v480H266zM0 186h640v108H0z' />
  </svg>
);

const LANGUAGES = [
  { code: "fr", label: "Français", Flag: FlagFR },
  { code: "en", label: "English", Flag: FlagGB },
] as const;

export default function LanguageSwitcher({
  buttonClassName = "",
  showFullText = true,
  showChevron = true,
}: {
  buttonClassName?: string;
  showFullText?: boolean;
  showChevron?: boolean;
}) {
  const { locale: currentLocale, setLocale } = useAppLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang =
    LANGUAGES.find((lang) => lang.code === currentLocale) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (code: string) => {
    if (code === currentLocale) {
      setIsOpen(false);
      return;
    }
    setLocale(code as SupportedLocale);
    setIsOpen(false);
  };

  const defaultButtonClass =
    "flex items-center justify-center gap-1.5 sm:gap-2 rounded-none border border-emerald-500/30 bg-[#0c1624] px-2.5 sm:px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer shadow-sm active:scale-95 h-[34px]";

  return (
    <div className='relative inline-block text-left font-mono z-50' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        title={activeLang.label}
        aria-label={activeLang.label}
        className={buttonClassName || defaultButtonClass}
        aria-expanded={isOpen}
      >
        <activeLang.Flag className='w-4 h-3 shrink-0' />
        {showFullText && (
          <span className='hidden sm:inline text-xs font-semibold tracking-wide text-slate-200'>
            {activeLang.label}
          </span>
        )}
        {showChevron && (
          <Icon
            name='chevronDown'
            className={`h-3 w-3 text-slate-400 transition-transform shrink-0 ${
              isOpen ? "rotate-180 text-emerald-400" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-1.5 w-36 origin-top-right rounded-none border border-emerald-500/40 bg-[#08101a] shadow-[0_12px_40px_rgba(0,0,0,0.95)] py-1 z-[100] animate-in fade-in zoom-in-95 duration-100'>
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLocale;
            const FlagComponent = lang.Flag;
            return (
              <button
                key={lang.code}
                type='button'
                onPointerDown={(e) => {
                  // Ensure immediate response on mobile touch before click / blur
                  e.preventDefault();
                  switchLanguage(lang.code);
                }}
                onClick={() => switchLanguage(lang.code)}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer touch-manipulation ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span className='flex items-center gap-2'>
                  <FlagComponent className='w-4 h-3 shrink-0' />
                  <span>{lang.label}</span>
                </span>
                {isSelected && (
                  <Icon name='check' className='h-3.5 w-3.5 text-emerald-400' />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
