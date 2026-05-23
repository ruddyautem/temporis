import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

const ANIMAL = [
  "loup",
  "corbeau",
  "renard",
  "lynx",
  "hibou",
  "serpent",
  "faucon",
  "ours",
  "requin",
  "tigre",
  "aigle",
];

const ADJECTIVES = [
  "flamboyant",
  "silencieux",
  "solitaire",
  "rapide",
  "mystérieux",
  "lumineux",
  "sauvage",
  "ancien",
  "furtif",
  "brillant",
  "ardent",
  "serein",
  "électrique",
  "nocturne",
  "cosmique",
  "agile",
];

const STORAGE_KEY = "chat";

const generateUsername = () => {
  const prefix = ANIMAL[Math.floor(Math.random() * ANIMAL.length)];

  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];

  return `${prefix}-${adjective}-${nanoid(4)}`;
};

const useUsername = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      setUsername(stored);
      return;
    }

    const generated = generateUsername();

    localStorage.setItem(STORAGE_KEY, generated);
    setUsername(generated);
  }, []);

  return { username };
};

export default useUsername;
