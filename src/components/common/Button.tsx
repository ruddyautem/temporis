import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40",
  danger:
    "border-red-500/20 bg-red-500/5 text-red-400/80 hover:bg-red-500/10 hover:text-red-400",
  ghost:
    "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700/50",
};

const Button = ({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={`cursor-pointer rounded-xl border py-4 text-[11px] sm:text-[11px] md:text-[12px]font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
  >
    {children}
  </button>
);

export default Button;
