import type { IconName } from "@/components/Icons";

export const TTL_OPTIONS = [5, 15, 30] as const;
export type RoomTtlMinutes = (typeof TTL_OPTIONS)[number];

export const TRUST_FEATURES: { icon: IconName; label: string }[] = [
  { icon: "lock", label: "Chiffrement" },
  { icon: "trash", label: "Sans rétention" },
  { icon: "clock", label: "Auto-destruction" },
];

export const ROOM_STATUS_MESSAGES: Record<
  string,
  { text: string; cls: string }
> = {
  destroyed: {
    text: "Cette room a été détruite.",
    cls: "text-red-400 justify-center",
  },
  "room-not-found": {
    text: "Room introuvable ou expirée.",
    cls: "text-orange-400 justify-center",
  },
  "room-full": {
    text: "La room est complète.",
    cls: "text-yellow-400 justify-center",
  },
};
