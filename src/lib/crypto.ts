// Helper : Convertir ArrayBuffer en Base64URL
const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Helper : Convertir Base64URL en Uint8Array
export const base64ToArrayBuffer = (base64url: string): Uint8Array => {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Generate a random AES-GCM key client-side
export const generateRoomKey = async (): Promise<CryptoKey> => {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable, so we can export it into the URL
    ["encrypt", "decrypt"]
  );
};

// Export the key to base64 string for URL fragment
export const exportKeyToBase64 = async (key: CryptoKey): Promise<string> => {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
};

// Import key from base64 string
export const importKeyFromBase64 = async (keyBase64: string): Promise<CryptoKey> => {
  const raw = base64ToArrayBuffer(keyBase64);
  return window.crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptText = async (text: string, key: CryptoKey): Promise<string> => {
  try {
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
  key: CryptoKey
): Promise<string> => {
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 2) return "[Decryption Error]";

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
