// Crypto utilities using WebCrypto API only

constenc = new TextEncoder();
const dec = new TextDecoder();

export async function generateKey() {
  // Generate secp256k1 key using subtle crypto (import from raw random bytes)
  const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
  
  // For now, return a format we can work with
  // Full nostr-tools integration would use @noble/secp256k1
  return {
    nsec: 'nsec1' + Array.from(keyMaterial)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 58),
    npub: 'npub1' + Array.from(keyMaterial)
      .map(b => (b ^ 0x55).toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 58)
  };
}

export async function deriveKey(password, salt) {
  // PBKDF2 with SHA-256 to derive 256-bit key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(secret, pin) {
  // Generate 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive 256-bit key from PIN
  const key = await deriveKey(pin, salt);
  
  // Generate 12-byte IV for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(secret)
  );
  
  return {
    v: 1, // version
    s: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    ct: arrayToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptSecret(encrypted, pin) {
  // Decode base64
  const salt = base64ToArray(encrypted.s);
  const iv = base64ToArray(encrypted.iv);
  const ciphertext = base64ToArray(encrypted.ct);
  
  // Derive key
  const key = await deriveKey(pin, salt);
  
  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return dec.decode(plaintext);
}

export async function signEvent(eventTemplate, nsec) {
  // Simplified signing - full implementation needs schnorr sigs
  // For demo, return event with mock signature
  const pubkey = getPublicKey(nsec);
  const event = {
    ...eventTemplate,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    id: await calculateEventId({ ...eventTemplate, pubkey }),
    sig: 'MOCK_SIGNATURE_' + crypto.getRandomValues(new Uint8Array(32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  };
  return event;
}

function getPublicKey(nsec) {
  // Placeholder - real impl needs secp256k1 point multiplication
  return nsec.replace('nsec1', 'npub1');
}

async function calculateEventId(event) {
  const data = [0, event.pubkey, event.created_at, event.kind, event.tags, event.content];
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Base64 helpers
function arrayToBase64(arr) {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// BIP39 mnemonic generation (simplified)
export function generateMnemonic() {
  const words = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'];
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  const indices = [];
  for (let i = 0; i < 12; i++) {
    indices.push(entropy[i] % words.length);
  }
  return indices.map(i => words[i]).join(' ');
}

export { arrayToBase64, base64ToArray };
