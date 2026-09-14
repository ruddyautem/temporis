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
          "!font-mono !text-[11px] sm:!text-xs !py-1.5 !px-3.5 sm:!px-5 !h-[34px] !min-h-[34px] !max-h-[34px] !w-fit !min-w-[180px] sm:!min-w-[240px] !max-w-[calc(100vw-32px)] sm:!max-w-[360px] !mx-auto !box-border",
      }}
    />
  );
}
