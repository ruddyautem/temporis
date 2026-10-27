"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useUsername from "@/hooks/use-username";
import { client } from "@/lib/client";
import { copyRoomInviteLink } from "@/lib/invite-link";
import { TTL_OPTIONS, type RoomTtlMinutes } from "@/lib/room-config";
import { Icon } from "@/components/Icons";
import SegmentedDurationSlider, { type DurationSliderHandle } from "@/components/lobby/SegmentedDurationSlider";


export default function Lobby() {
  const t = useTranslations("Lobby");
  const tCommon = useTranslations("Common");
  const { username, regenerateUsername } = useUsername();
  const router = useRouter();
  const searchParams = useSearchParams();

  const durationSliderRef = useRef<DurationSliderHandle>(null);
  const [ttl, setTtl] = useState<RoomTtlMinutes>(15);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const destroyed = searchParams.get("destroyed") === "true";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (destroyed) {
      toast.error(t("toastRoomDestroyed"), { id: "room-destroyed-toast" });
    } else if (errorParam === "room-not-found") {
      toast.error(t("toastNotFound"), { id: "room-not-found-toast" });
    } else if (errorParam === "room-full") {
      toast.error(t("toastFull"), { id: "room-full-toast" });
    }

    if (destroyed || errorParam) window.history.replaceState({}, "", "/");
  }, [destroyed, errorParam, t]);

  const { mutate: createRoom, isPending } = useMutation<
    { roomId: string },
    Error,
    RoomTtlMinutes
  >({
    mutationKey: ["createRoom"],
    mutationFn: async (minutes) => {
      const res = await client.room.create.post(
        {},
        { query: { ttl: String(minutes) } },
      );
      const anyRes = res as unknown as { error?: unknown; data?: { roomId?: string }; status?: number };
      if (anyRes.error) {
        throw new Error(
          typeof anyRes.error === "string"
            ? anyRes.error
            : JSON.stringify(anyRes.error) || "Network error"
        );
      }
      if (anyRes.data?.roomId) {
        return { roomId: anyRes.data.roomId };
      }
      throw new Error(`Status ${anyRes.status || "unknown"}`);
    },
    onSuccess: async (data) => {
      try {
        const { generateRoomKey, exportKeyToBase64 } = await import("@/lib/crypto");
        const secretKey = await generateRoomKey();
        const exportedKey = await exportKeyToBase64(secretKey);
        await copyRoomInviteLink(data.roomId, `#key=${exportedKey}`);
        toast.success(t("toastRoomCreated"));
        router.push(`/room/${data.roomId}#key=${exportedKey}`);
      } catch (err: unknown) {
        console.error("Key generation failed:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(
          errMsg.includes("Crypto") || !window.isSecureContext
            ? "Erreur WebCrypto : HTTPS ou localhost requis pour le chiffrement."
            : t("toastCreationError")
        );
      }
    },
    onError: (error) => {
      console.error("Room creation error:", error);
      toast.error(error.message || t("toastCreationError"));
    },
  });

  const handleRegenerate = () => {
    setIsRegenerating(true);
    regenerateUsername();
    setTimeout(() => setIsRegenerating(false), 300);
  };

  return (
    <div className="lobby-experiment">
      <div className="lobby-hero">
        <span className="lobby-eyebrow"><Icon name="lock" className="h-3 w-3" />{tCommon("badge")}</span>
        <h1><span className="text-emerald-400">&gt;</span>TEMPOR<span className="text-emerald-400">IS</span><span className="lobby-cursor" aria-hidden="true">_</span></h1>
        <p>{t("heroDescription")}</p>
      </div>
      <div className="lobby-panels">
        <section className="lobby-panel lobby-panel-create" aria-labelledby="create-title">
          <div className="lobby-panel-heading">
            <h2 id="create-title"><Icon name="plus" className="h-4 w-4 text-emerald-400" />{t("panelCreate")}</h2>
            <span className="lobby-index" aria-hidden="true">01 /</span>
          </div>

          <section className="session-duration" aria-labelledby="duration-title">
            <div className="session-duration-heading"><h3 id="duration-title">{t("chooseTime")}</h3><span className="session-duration-limit">05 — 30 MIN</span></div>
            <div className="session-time-display">
              <div className="session-duration-summary">
                <div className="session-time-value" aria-live="polite"><span>{String(ttl).padStart(2, "0")}</span><span>{t("minutes")}</span></div>
                <div className="session-expiry"><span><Icon name="clock" className="h-3.5 w-3.5" />{t("autoDeleteLabel")}</span><p>{t("timeCaption")}</p></div>
              </div>
              <SegmentedDurationSlider ref={durationSliderRef} ttl={ttl} onChange={setTtl} label={t("chooseTime")} minutesLabel={t("minutes")} />
            </div>
            <div className="session-time-options" role="group" aria-labelledby="duration-title">
              {TTL_OPTIONS.map((minutes) => (
                <button key={minutes} type="button" aria-pressed={ttl === minutes} onClick={() => durationSliderRef.current?.select(minutes)}>
                  <span className="session-option-indicator" aria-hidden="true">{ttl === minutes && <Icon name="check" className="h-3 w-3" />}</span>
                  <span className="session-option-duration">{minutes}<span> min</span></span><span className="session-option-caption">{t(`duration${minutes}`)}</span>
                </button>
              ))}
            </div>
          </section>
          <div className="session-identity">
            <span className="session-identity-icon"><Icon name="user" className="h-4 w-4" /></span>
            <div className="session-identity-text"><span>{tCommon("identity")}</span><strong aria-live="polite">{username || tCommon("loading")}</strong></div>
            <button type="button" onClick={handleRegenerate} title={tCommon("reroll")} aria-label={tCommon("reroll")}><Icon name="refresh" className={isRegenerating ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} /></button>
          </div>
          <div className="session-launch">
            <button type="button" onClick={() => createRoom(ttl)} disabled={isPending || !username} className="lobby-launch-button" aria-busy={isPending}>
              <Icon name="lock" className="h-4 w-4" /><span>{isPending ? t("creating") : t("desktopCreateButton")}</span><Icon name="arrowRight" className="ml-auto h-4 w-4" />
            </button>

          </div>
        </section>
        <section className="lobby-panel lobby-panel-about" aria-labelledby="about-title">
          <div className="lobby-panel-heading">
            <h2 id="about-title"><Icon name="shield" className="h-4 w-4 text-emerald-400" />{t("panelAbout")}</h2>
            <span className="lobby-index" aria-hidden="true">02 /</span>
          </div>
          <div className="lobby-manifesto">
            <span className="lobby-label">{t("manifestoLabel")}</span>
            <h3>{t("manifestoTitle")}<br /><span>{t("manifestoAccent")}</span></h3>
            <p>{t("manifestoDescription")}</p>
          </div>
          <div className="lobby-principles">
            {([
              { icon: "shield", title: "cardProtoTitle", description: "cardProtoDesc" },
              { icon: "user", title: "anonymousTitle", description: "anonymousDescription" },
              { icon: "trash", title: "cardStorageTitle", description: "privacyDescription" },
            ] as const).map(({ icon, title, description }) => (
              <div className="lobby-principle" key={title}>
                <span className={icon === "trash" ? "lobby-icon lobby-icon-danger" : "lobby-icon"}><Icon name={icon} className="h-4 w-4" /></span>
                <div><h3>{t(title)}</h3><p>{t(description)}</p></div>
              </div>
            ))}
          </div>
          <div className="lobby-protocol"><Icon name="lock" className="h-3 w-3" /><span>AES-256-GCM</span><span aria-hidden="true">/</span><span>{t("protocolLabel")}</span></div>
        </section>
      </div>
      <div className="lobby-steps" aria-label={t("stepsLabel")}>
        {["stepCreate", "stepShare", "stepDisappear"].map((step, index) => <span key={step}><b>0{index + 1}</b>{t(step)}</span>)}
      </div>
    </div>
  );
}
