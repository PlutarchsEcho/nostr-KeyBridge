// IndexedDB storage for encrypted keys

const DB_NAME = 'NostrKeyBridge';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

let db;

export async function initStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('oauthProvider', 'oauthProvider', { unique: false });
        store.createIndex('oauthSub', 'oauthSub', { unique: true });
      }
    };
  });
}

export async function saveKey(keyData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(keyData);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getKey(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getKeyByOAuth(provider, sub) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('oauthSub');
    const request = index.get(`${provider}:${sub}`);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteKey(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listKeys() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Session state (in-memory only)
let sessionState = null;

export function setSession(state) {
  sessionState = state;
  sessionStorage.setItem('nkb_session', JSON.stringify(state));
}

export function getSession() {
  if (sessionState) return sessionState;
  
  const saved = sessionStorage.getItem('nkb_session');
  if (saved) {
    sessionState = JSON.parse(saved);
    return sessionState;
  }
  return null;
}

export function clearSession() {
  sessionState = null;
  sessionStorage.removeItem('nkb_session');
}
