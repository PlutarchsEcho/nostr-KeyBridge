// Main app logic - OAuth + crypto + storage

import { generateKey, encryptSecret, decryptSecret, signEvent, generateMnemonic } from './crypto.js';
import { initStorage, saveKey, getKeyByOAuth, deleteKey, setSession, getSession, clearSession } from './store.js';
import { isAppleConfigured, configureApple, signInWithApple, handleAppleCallback, APPLE_CONFIG_KEY, loadAppleScript } from './apple.js';

// OAuth storage keys
const GOOGLE_CONFIG_KEY = 'nkb_google_client_id';

let currentUser = null;

// Initialize
async function init() {
  await initStorage();
  
  // Check for Google OAuth callback (hash)
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('id_token')) {
    await handleGoogleCallback();
    return;
  }
  
  // Check for Apple OAuth callback (query params)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('code') && urlParams.get('state')) {
    await handleAppleAuth();
    return;
  }
  
  // Check for existing session
  const session = getSession();
  if (session?.userId) {
    const key = await getKeyByOAuth(session.provider, session.sub);
    if (key) {
      currentUser = session;
      showDashboard(key.npub);
    } else {
      currentUser = session;
      showCreateKey();
    }
  } else {
    showWelcome();
  }
}

// OAuth sign in - Google
window.signInWithGoogle = () => {
  const GOOGLE_CLIENT_ID = localStorage.getItem(GOOGLE_CONFIG_KEY);
  if (!GOOGLE_CLIENT_ID) {
    alert('Please configure Google OAuth Client ID first.\n\nGet one at: https://console.cloud.google.com/\n\nUnder APIs & Services > Credentials > Create OAuth 2.0 Client ID');
    return;
  }
  
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  sessionStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token id_token',
    scope: 'openid email',
    state: state,
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  });
  
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

// OAuth sign in - Apple
window.signInWithApple = async () => {
  try {
    const user = await signInWithApple();
    if (!user) return;
    
    // Check for existing key
    const existingKey = await getKeyByOAuth('apple', user.sub);
    
    currentUser = {
      userId: user.sub,
      provider: 'apple',
      sub: user.sub,
      email: user.email,
      name: user.name
    };
    
    setSession(currentUser);
    
    if (existingKey) {
      showDashboard(existingKey.npub);
    } else {
      showCreateKey();
    }
  } catch (err) {
    console.error('Apple sign in failed:', err);
    alert('Apple sign in failed: ' + err.message);
  }
};

// Handle Google OAuth callback
async function handleGoogleCallback() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const state = params.get('state');
  
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    alert('Invalid OAuth state. Possible attack.');
    showWelcome();
    return;
  }
  
  sessionStorage.removeItem('oauth_state');
  
  if (!accessToken && !idToken) {
    showWelcome();
    return;
  }
  
  const userInfo = idToken ? parseJwt(idToken) : await fetchGoogleUserInfo(accessToken);
  
  if (!userInfo?.sub) {
    alert('Failed to get user info from OAuth');
    showWelcome();
    return;
  }
  
  const existingKey = await getKeyByOAuth('google', userInfo.sub);
  
  currentUser = {
    userId: userInfo.sub,
    provider: 'google',
    sub: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name
  };
  
  setSession(currentUser);
  window.history.replaceState({}, document.title, window.location.pathname);
  
  if (existingKey) {
    showDashboard(existingKey.npub);
  } else {
    showCreateKey();
  }
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchGoogleUserInfo(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return { sub: data.id, email: data.email, name: data.name };
  } catch {
    return null;
  }
}

// Handle Apple OAuth callback/redirect
async function handleAppleAuth() {
  const user = await handleAppleCallback();
  if (!user) {
    showWelcome();
    return;
  }
  
  // Check for existing key
  const existingKey = await getKeyByOAuth('apple', user.sub);
  
  currentUser = {
    userId: user.sub,
    provider: 'apple',
    sub: user.sub,
    email: user.email,
    name: user.name
  };
  
  setSession(currentUser);
  
  // Clear URL params
  window.history.replaceState({}, document.title, window.location.pathname);
  
  if (existingKey) {
    showDashboard(existingKey.npub);
  } else {
    showCreateKey();
  }
}

// Configuration exports
window.configureGoogle = () => {
  const clientId = prompt('Enter Google OAuth Client ID:', localStorage.getItem(GOOGLE_CONFIG_KEY) || '');
  if (clientId?.trim()) {
    localStorage.setItem(GOOGLE_CONFIG_KEY, clientId.trim());
    alert('Google OAuth configured!');
  }
};

window.configureApple = () => {
  configureApple();
};

// Create key
window.createKey = async () => {
  const pin = document.getElementById('pin-create').value;
  const confirm = document.getElementById('pin-confirm').value;
  
  if (pin.length < 6) {
    alert('PIN must be at least 6 digits');
    return;
  }
  if (pin !== confirm) {
    alert('PINs do not match');
    return;
  }
  
  const { nsec, npub } = await generateKey();
  const encrypted = await encryptSecret(nsec, pin);
  
  const keyData = {
    id: currentUser.userId,
    oauthProvider: 'google',
    oauthSub: currentUser.sub,
    npub: npub,
    encrypted: encrypted,
    createdAt: Date.now()
  };
  
  await saveKey(keyData);
  
  document.getElementById('pin-create').value = '';
  document.getElementById('pin-confirm').value = '';
  
  showDashboard(npub);
};

// Sign event
window.signEvent = () => {
  document.getElementById('step-dashboard').classList.add('hidden');
  document.getElementById('step-sign').classList.remove('hidden');
};

window.cancelSign = () => {
  document.getElementById('step-sign').classList.add('hidden');
  document.getElementById('step-dashboard').classList.remove('hidden');
  document.getElementById('sign-result').classList.add('hidden');
};

window.doSign = async () => {
  const pin = document.getElementById('pin-sign').value;
  const content = document.getElementById('event-content').value;
  
  if (!pin) {
    alert('Enter PIN');
    return;
  }
  
  try {
    const key = await getKeyByOAuth('google', currentUser.sub);
    if (!key) {
      alert('No key found');
      return;
    }
    
    const nsec = await decryptSecret(key.encrypted, pin);
    const event = await signEvent({
      kind: 1,
      content: content,
      tags: []
    }, nsec);
    
    document.getElementById('pin-sign').value = '';
    
    const resultDiv = document.getElementById('sign-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `<pre style="background:#0a0a15;padding:1rem;border-radius:4px;overflow:auto;font-size:0.8rem;">${JSON.stringify(event, null, 2)}</pre>`;
    
  } catch (err) {
    alert('Signing failed: ' + err.message);
  }
};

// Export
window.showExport = () => {
  document.getElementById('step-dashboard').classList.add('hidden');
  document.getElementById('step-export').classList.remove('hidden');
};

window.hideExport = () => {
  document.getElementById('step-export').classList.add('hidden');
  document.getElementById('step-dashboard').classList.remove('hidden');
  document.getElementById('exported-nsec').classList.add('hidden');
};

window.doExport = async () => {
  const pin = document.getElementById('pin-export').value;
  
  if (!pin) {
    alert('Enter PIN');
    return;
  }
  
  try {
    const key = await getKeyByOAuth('google', currentUser.sub);
    const nsec = await decryptSecret(key.encrypted, pin);
    
    document.getElementById('exported-nsec').textContent = nsec;
    document.getElementById('exported-nsec').classList.remove('hidden');
    
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
};

// Backup
window.downloadBackup = async () => {
  const key = await getKeyByOAuth('google', currentUser.sub);
  if (!key) {
    alert('No key to backup');
    return;
  }
  
  const backup = {
    version: 1,
    created: Date.now(),
    npub: key.npub,
    encrypted: key.encrypted
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nostr-backup-${key.npub.slice(0, 16)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Restore
window.restoreFromBackup = () => {
  document.getElementById('step-welcome').classList.add('hidden');
  document.getElementById('step-restore').classList.remove('hidden');
};

window.cancelRestore = () => {
  document.getElementById('step-restore').classList.add('hidden');
  document.getElementById('step-welcome').classList.remove('hidden');
};

window.doRestore = async () => {
  const input = document.getElementById('restore-input').value.trim();
  const pin = document.getElementById('pin-restore').value;
  
  if (!input) {
    alert('Paste backup or nsec');
    return;
  }
  
  if (input.startsWith('nsec1')) {
    if (!pin || pin.length < 6) {
      alert('Set a PIN to encrypt');
      return;
    }
    
    const encrypted = await encryptSecret(input, pin);
    const id = 'manual-' + Date.now();
    
    await saveKey({
      id,
      oauthProvider: 'manual',
      oauthSub: id,
      npub: input.replace('nsec1', 'npub1'),
      encrypted: encrypted,
      createdAt: Date.now()
    });
    
    setSession({
      userId: id,
      provider: 'manual',
      sub: id
    });
    
    showDashboard(input.replace('nsec1', 'npub1'));
    
  } else {
    try {
      const backup = JSON.parse(input);
      const id = 'restored-' + Date.now();
      
      await saveKey({
        id,
        oauthProvider: 'restored',
        oauthSub: id,
        npub: backup.npub,
        encrypted: backup.encrypted,
        createdAt: Date.now()
      });
      
      setSession({
        userId: id,
        provider: 'restored',
        sub: id
      });
      
      showDashboard(backup.npub);
      
    } catch {
      alert('Invalid backup format. Must be JSON or raw nsec.');
    }
  }
};

// Logout
window.logout = async () => {
  if (confirm('Logout? Your encrypted keys remain in this browser. Download backup first if migrating.')) {
    clearSession();
    currentUser = null;
    showWelcome();
  }
};

// UI helpers
function showWelcome() {
  hideAll();
  document.getElementById('step-welcome').classList.remove('hidden');
}

function showCreateKey() {
  hideAll();
  document.getElementById('step-create').classList.remove('hidden');
}

function showDashboard(npub) {
  hideAll();
  document.getElementById('npub-display').textContent = npub;
  document.getElementById('step-dashboard').classList.remove('hidden');
}

function hideAll() {
  document.querySelectorAll('.card').forEach(el => el.classList.add('hidden'));
}

// Init
init().catch(console.error);
