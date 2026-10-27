"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/common/Button";

interface ParticipantLeftDialogProps {
  username: string;
  onCopyLink: () => Promise<boolean>;
  onDestroy: () => void;
  onDismiss: () => void;
}

export default function ParticipantLeftDialog({
  username, onCopyLink, onDestroy, onDismiss,
}: ParticipantLeftDialogProps) {
  const t = useTranslations("Room");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const copyLink = async () => {
    setIsCopying(true);
    try {
      if (await onCopyLink()) onDismiss();
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="participant-left-title"
      aria-describedby="participant-left-description"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      className="terminal-frame relative m-auto w-[calc(100%-2rem)] max-w-md border border-emerald-500/40 bg-[#09151e] p-6 font-mono text-slate-100 shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:p-7"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
        {t("participantLeftBadge")}
      </p>
      <h2 id="participant-left-title" className="mb-3 text-lg font-bold leading-snug">
        {t("participantLeftTitle")}
      </h2>
      <p className="mb-3 break-words text-sm text-slate-200">
        {t("participantLeftName", { username })}
      </p>
      <p id="participant-left-description" className="mb-6 text-xs leading-relaxed text-slate-400">
        {t("participantLeftDescription")}
      </p>
      <div className="flex flex-col gap-2.5">
        <Button type="button" onClick={copyLink} disabled={isCopying}>
          {isCopying ? "…" : t("participantLeftCopy")}
        </Button>
        <Button type="button" variant="danger" onClick={onDestroy}>
          {t("destroy")}
        </Button>
      </div>
    </dialog>
  );
}
