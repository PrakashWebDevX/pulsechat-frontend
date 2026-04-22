/**
 * End-to-End Encryption using Web Crypto API (ECDH + AES-GCM)
 * Keys are generated per-session and stored in localStorage.
 * In production, use a proper key exchange server.
 */

const DB_NAME = "pulsechat-keys";

// Generate a new ECDH key pair
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const pubKeyBuffer = await crypto.subtle.exportKey("spki", pair.publicKey);
  const pubKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pubKeyBuffer)));
  // Store private key in localStorage (base64)
  const privKeyBuffer = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const privKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privKeyBuffer)));
  localStorage.setItem("pc_privkey", privKeyB64);
  localStorage.setItem("pc_pubkey", pubKeyB64);
  return { publicKey: pubKeyB64, privateKey: pair.privateKey };
}

// Load existing or generate new key pair
export async function getOrCreateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }> {
  try {
    const privB64 = localStorage.getItem("pc_privkey");
    const pubB64 = localStorage.getItem("pc_pubkey");
    if (privB64 && pubB64) {
      const privBuffer = Uint8Array.from(atob(privB64), (c) => c.charCodeAt(0));
      const privateKey = await crypto.subtle.importKey("pkcs8", privBuffer, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
      return { publicKey: pubB64, privateKey };
    }
  } catch {}
  return generateKeyPair();
}

// Derive shared AES key from our private key + their public key
async function deriveSharedKey(privateKey: CryptoKey, theirPublicKeyB64: string): Promise<CryptoKey> {
  const pubBuffer = Uint8Array.from(atob(theirPublicKeyB64), (c) => c.charCodeAt(0));
  const theirPublicKey = await crypto.subtle.importKey("spki", pubBuffer, { name: "ECDH", namedCurve: "P-256" }, false, []);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message
export async function encryptMessage(plaintext: string, theirPublicKey: string, myPrivateKey: CryptoKey): Promise<string> {
  try {
    const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded);
    const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
    return "🔐" + btoa(String.fromCharCode(...combined));
  } catch {
    return plaintext; // Fallback to plaintext if encryption fails
  }
}

// Decrypt a message
export async function decryptMessage(ciphertext: string, theirPublicKey: string, myPrivateKey: CryptoKey): Promise<string> {
  if (!ciphertext.startsWith("🔐")) return ciphertext;
  try {
    const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);
    const combined = Uint8Array.from(atob(ciphertext.slice(2)), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, data);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "🔐 [Encrypted message]";
  }
}

export function isEncrypted(msg: string): boolean {
  return msg.startsWith("🔐");
}
