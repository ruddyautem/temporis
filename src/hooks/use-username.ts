import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";

const ANIMALS_FR = [
  "loup",
  "corbeau",
  "renard",
  "lynx",
  "hibou",
  "vipere",
  "faucon",
  "ours",
  "requin",
  "tigre",
  "aigle",
];

const ANIMALS_EN = [
  "wolf",
  "raven",
  "fox",
  "lynx",
  "owl",
  "viper",
  "falcon",
  "bear",
  "shark",
  "tiger",
  "eagle",
];

const ADJECTIVES_FR = [
  "flamboyant",
  "silencieux",
  "solitaire",
  "rapide",
  "mysterieux",
  "lumineux",
  "sauvage",
  "ancien",
  "furtif",
  "brillant",
  "ardent",
  "serein",
  "electrique",
  "nocturne",
  "cosmique",
  "agile",
];

const ADJECTIVES_EN = [
  "flaming",
  "silent",
  "lone",
  "swift",
  "shadowy",
  "luminous",
  "wild",
  "ancient",
  "stealthy",
  "radiant",
  "blazing",
  "serene",
  "electric",
  "nocturnal",
  "cosmic",
  "nimble",
];

const STORAGE_KEY = "chat";

export const generateUsernamePair = () => {
  // French: [animal]-[adjectif]-[suffix] (ex: loup-silencieux-a1b2)
  const animalFr = ANIMALS_FR[Math.floor(Math.random() * ANIMALS_FR.length)];
  const adjectiveFr = ADJECTIVES_FR[Math.floor(Math.random() * ADJECTIVES_FR.length)];
  const suffixFr = nanoid(4);

  // English: [adjective]-[animal]-[suffix] (ex: silent-wolf-c3d4)
  const animalEn = ANIMALS_EN[Math.floor(Math.random() * ANIMALS_EN.length)];
  const adjectiveEn = ADJECTIVES_EN[Math.floor(Math.random() * ADJECTIVES_EN.length)];
  const suffixEn = nanoid(4);

  return {
    fr: `${animalFr}-${adjectiveFr}-${suffixFr}`,
    en: `${adjectiveEn}-${animalEn}-${suffixEn}`,
  };
};

export const generateUsername = (locale?: string) => {
  const pair = generateUsernamePair();
  return locale === "en" ? pair.en : pair.fr;
};

const useUsername = () => {
  const currentLocale = useLocale();
  const [username, setUsername] = useState("");

  const refreshUsernamePair = useCallback(() => {
    const pair = generateUsernamePair();
    try {
      localStorage.setItem(`${STORAGE_KEY}_fr`, pair.fr);
      localStorage.setItem(`${STORAGE_KEY}_en`, pair.en);
      localStorage.setItem(STORAGE_KEY, currentLocale === "en" ? pair.en : pair.fr);
    } catch {}
    const activeUsername = currentLocale === "en" ? pair.en : pair.fr;
    setUsername(activeUsername);
    return activeUsername;
  }, [currentLocale]);

  useEffect(() => {
    try {
      const storedForLocale = localStorage.getItem(`${STORAGE_KEY}_${currentLocale}`);
      if (storedForLocale) {
        setUsername(storedForLocale);
        return;
      }

      // If one exists from the other locale, check if we need to regenerate both
      const storedOther = localStorage.getItem(`${STORAGE_KEY}_${currentLocale === "en" ? "fr" : "en"}`);
      if (!storedOther) {
        refreshUsernamePair();
        return;
      }
    } catch {}

    refreshUsernamePair();
  }, [currentLocale, refreshUsernamePair]);

  return { username, regenerateUsername: refreshUsernamePair };
};

export default useUsername;
