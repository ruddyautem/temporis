"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icons";


interface JoinScreenProps {
  username: string;
  onRegenerateUsername?: () => void;
  onJoin: () => void;
  onDecline: () => void;
}

const JoinScreen = ({
  username,
  onRegenerateUsername,
  onJoin,
  onDecline,
}: JoinScreenProps) => {
  const t = useTranslations("Join");
  const tCommon = useTranslations("Common");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    if (!onRegenerateUsername) return;
    setIsRegenerating(true);
    onRegenerateUsername();
    setTimeout(() => setIsRegenerating(false), 300);
  };

  return (
    <div className="lobby-experiment join-experiment">
      <section className="lobby-panel join-card" aria-labelledby="join-title">
        <div className="join-intro">
          <div className="join-topline">
            <span className="lobby-eyebrow"><Icon name="door" className="h-3 w-3" />{t("invitationBadge")}</span>
            <button type="button" onClick={onDecline} className="join-back">{t("backHome")}</button>
          </div>
          <h1 id="join-title">{t("invitationTitle")}</h1>
          <p>{t("invitedSubtitle")}</p>
        </div>

        <div className="join-identity">
          <span className="session-identity-icon"><Icon name="user" className="h-4 w-4" /></span>
          <div className="session-identity-text">
            <span>{tCommon("identity")}</span>
            <strong aria-live="polite">{username || tCommon("loading")}</strong>
          </div>
          {onRegenerateUsername && (
            <button type="button" onClick={handleRegenerate} title={tCommon("reroll")} aria-label={tCommon("reroll")}>
              <Icon name="refresh" className={isRegenerating ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"} />
            </button>
          )}
        </div>

        <div className="join-assurances">
          <span><Icon name="shield" className="h-3.5 w-3.5 shrink-0" />{tCommon("badge")}</span>
          <span><Icon name="clock" className="h-3.5 w-3.5 shrink-0" />{t("ephemeralLabel")}</span>
        </div>

        <div className="join-actions">
          <button type="button" onClick={onJoin} disabled={!username} className="lobby-launch-button">
            <Icon name="door" className="h-4 w-4" /><span>{t("joinRoom")}</span><Icon name="arrowRight" className="ml-auto h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default JoinScreen;
