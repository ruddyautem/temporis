"use client";

import { ToastContainer, TypeOptions, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position='top-center'
      theme='dark'
      hideProgressBar={false}
      closeButton={false}
      autoClose={1500}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={false}
      transition={Slide}
      toastClassName={(context?: { type?: TypeOptions | string }) => {
        const typeClasses = {
          success:
            "border-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          error:
            "border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
          info: "border-sky-500/20 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.1)]",
          warning:
            "border-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
          default: "border-slate-700/40 text-slate-300",
        };

        const toastType = context?.type || "default";
        const selectedClass =
          toastType in typeClasses
            ? typeClasses[toastType as keyof typeof typeClasses]
            : typeClasses.default;

        return `${selectedClass} relative flex items-center justify-center px-4 py-4 min-h-0 bg-[#0a1118]/90 backdrop-blur-md border rounded-lg overflow-hidden cursor-pointer font-mono text-[10px] md:text-[11px] uppercase tracking-wider mt-3 text-center`;
      }}
    />
  );
}
