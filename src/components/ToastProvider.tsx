"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position='top-center'
      offset='8px'
      mobileOffset={{ top: "8px" }}
      theme='dark'
      richColors
      duration={2000}
      closeButton={false}
      style={{
        display: "flex",
        justifyContent: "center",
      }}
      toastOptions={{
        duration: 2000,
        className:
          "!font-mono !text-[11px] sm:!text-xs !py-1.5 !px-3.5 sm:!px-5 !h-8.5 !min-h-8.5 !max-h-8.5 !w-fit !min-w-45 sm:!min-w-60 !max-w-[calc(100vw-32px)] sm:!max-w-90 !mx-auto !box-border",
      }}
    />
  );
}
