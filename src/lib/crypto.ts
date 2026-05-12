const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "CRITICAL: ENCRYPTION_KEY is missing in environment variables!",
  );
}

// Helper : Convertir ArrayBuffer en Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper : Convertir Base64 en Uint8Array
const base64ToArrayBuffer = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Dériver une clé AES-GCM valide à partir du mot de passe
const getCryptoKey = async (): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  // On hache le mot de passe pour obtenir 256 bits (32 bytes) parfaits pour AES-256
  const keyMaterial = await window.crypto.subtle.digest(
    "SHA-256",
    enc.encode(ENCRYPTION_KEY) as BufferSource,
  );

  return window.crypto.subtle.importKey(
    "raw",
    keyMaterial as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptText = async (text: string): Promise<string> => {
  try {
    const key = await getCryptoKey();
    // On force le type as Uint8Array pour satisfaire TypeScript
    const iv = window.crypto.getRandomValues(new Uint8Array(12)) as Uint8Array;
    const enc = new TextEncoder();

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      enc.encode(text) as BufferSource,
    );

    // On concatène l'IV (nécessaire pour déchiffrer) et le message chiffré
    const ivBase64 = arrayBufferToBase64(iv);
    const cipherBase64 = arrayBufferToBase64(cipherBuffer);

    return `${ivBase64}:${cipherBase64}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }
};

export const decryptText = async (
  encryptedPayload: string,
): Promise<string> => {
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 2) return "[Decryption Error]";

    const key = await getCryptoKey();
    const iv = base64ToArrayBuffer(parts[0]);
    const cipherBytes = base64ToArrayBuffer(parts[1]);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      cipherBytes as BufferSource,
    );

    return new TextDecoder().decode(decryptedBuffer as BufferSource);
  } catch {
    return "[Decryption Error]";
  }
};
