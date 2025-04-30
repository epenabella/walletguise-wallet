import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { derivePath } from "ed25519-hd-key"   // tiny lib, Phantom uses it
import { Keypair } from "@solana/web3.js"
import { wordlist } from '@scure/bip39/wordlists/english';


export async function sha256(msg: string): Promise<string> {
    const buf = new TextEncoder().encode(msg);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// AES‑GCM helpers – enough for local, *not* production‑grade key‑stretching.
const ivLength = 12; // 96‑bit nonce

async function getKeyFromPassword(password: string) {
    const base = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: new TextEncoder().encode("walletguise-salt"),
            iterations: 50_000,
            hash: "SHA-256"
        },
        base,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(data: Uint8Array, password: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const key = await getKeyFromPassword(password);
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(cipher)))}`;
}

export async function decrypt(cipherText: string, password: string): Promise<Uint8Array> {
    const [ivB64, dataB64] = cipherText.split(".");
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));
    const key = await getKeyFromPassword(password);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new Uint8Array(plain);
}

export function importFromMnemonic(mnemonic: string, account = 0): { keypair: Keypair } {
  if (!validateMnemonic(mnemonic, wordlist)) throw new Error("Invalid phrase");
  const seed = mnemonicToSeedSync(mnemonic.trim(), "");
  const path = `m/44'/501'/${account}'/0'`   // ← add /0'   // Solflare path

  const hexString = Buffer.from(seed).toString('hex');
  const { key } = derivePath(path, hexString);

  const keypair = Keypair.fromSeed(key)

  console.log('keypair imported public: ', keypair.publicKey.toString());
  console.log('keypair imported private: ', keypair.secretKey.toString());

  return { keypair };
}

// no pass-phrase
//const keypair = Keypair.fromSeed(seed.slice(0, 32));
