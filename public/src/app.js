// Nostr Key Bridge - Simplified working version

import { generateKey, encryptSecret, decryptSecret, signEvent } from './crypto.js';
import { initStorage, saveKey, getKeyByOAuth, setSession, getSession, clearSession } from './store.js';
import { configureApple, signInWithApple, handleAppleCallback, APPLE_CONFIG_KEY, loadAppleScript } from './apple.js';

const GOOGLE_CONFIG_KEY = 'nkb_google_client_id';
let currentUser = null;

// Make all functions global for onclick handlers
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

window.signInWithGoogle = () => {
  const clientId = localStorage.getItem(GOOGLE_CONFIG_KEY);
  if (!clientId) {
    alert('Please configure Google OAuth first. Click "⚙️ Google" button.');
    return;
  }
  
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token id_token',
    scope: 'openid email',
    state: state,
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
  });
  
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

window.signInWithApple = async () => {
  try {
    const user = await signInWithApple();
    if (!user) return;
    
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
    alert('Apple sign in failed: ' + err.message);
  }
};

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
  
  await saveKey({
    id: currentUser.userId,
    oauthProvider: currentUser.provider,
    oauthSub: currentUser.sub,
    npub: npub,
    encrypted: encrypted,
    createdAt: Date.now()
  });
  
  document.getElementById('pin-create').value = '';
  document.getElementById('pin-confirm').value = '';
  
  showDashboard(npub);
};

window.signEvent = () => {
  hideAll();
  document.getElementById('step-sign').classList.remove('hidden');
};

window.cancelSign = () => {
  hideAll();
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
    const key = await getKeyByOAuth(currentUser.provider, currentUser.sub);
    const nsec = await decryptSecret(key.encrypted, pin);
    const event = await signEvent({
      kind: 1,
      content: content,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    }, nsec);
    
    document.getElementById('pin-sign').value = '';
    
    const resultDiv = document.getElementById('sign-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `<pre style="background:#0a0a15;padding:1rem;border-radius:4px;overflow:auto;font-size:0.8rem;">${JSON.stringify(event, null, 2)}</pre>`;
  } catch (err) {
    alert('Signing failed: ' + err.message);
  }
};

window.showExport = () => {
  hideAll();
  document.getElementById('step-export').classList.remove('hidden');
};

window.hideExport = () => {
  hideAll();
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
    const key = await getKeyByOAuth(currentUser.provider, currentUser.sub);
    const nsec = await decryptSecret(key.encrypted, pin);
    
    document.getElementById('exported-nsec').textContent = nsec;
    document.getElementById('exported-nsec').classList.remove('hidden');
  } catch (err) {
    alert('Export failed: ' + err.message);
  }
};

window.downloadBackup = async () => {
  const key = await getKeyByOAuth(currentUser.provider, currentUser.sub);
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

window.restoreFromBackup = () => {
  hideAll();
  document.getElementById('step-restore').classList.remove('hidden');
};

window.cancelRestore = () => {
  hideAll();
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
    
    currentUser = { userId: id, provider: 'manual', sub: id };
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
      
      currentUser = { userId: id, provider: 'restored', sub: id };
      showDashboard(backup.npub);
    } catch {
      alert('Invalid backup format');
    }
  }
};

window.logout = () => {
  if (confirm('Logout? Download backup first if migrating.')) {
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

async function handleGoogleCallback() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  
  const idToken = params.get('id_token');
  const state = params.get('state');
  
  if (!idToken) {
    showWelcome();
    return;
  }
  
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    alert('Invalid OAuth state');
    showWelcome();
    return;
  }
  
  sessionStorage.removeItem('oauth_state');
  
  // Parse JWT
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  
  currentUser = {
    userId: payload.sub,
    provider: 'google',
    sub: payload.sub,
    email: payload.email,
    name: payload.name
  };
  
  setSession(currentUser);
  window.history.replaceState({}, document.title, window.location.pathname);
  
  const existingKey = await getKeyByOAuth('google', payload.sub);
  if (existingKey) {
    showDashboard(existingKey.npub);
  } else {
    showCreateKey();
  }
}

// Initialize
async function init() {
  await initStorage();
  
  // Check for Google OAuth callback
  if (window.location.hash.includes('id_token')) {
    await handleGoogleCallback();
    return;
  }
  
  // Check for Apple OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('code')) {
    const user = await handleAppleCallback();
    if (user) {
      currentUser = {
        userId: user.sub,
        provider: 'apple',
        sub: user.sub,
        email: user.email
      };
      setSession(currentUser);
      const existingKey = await getKeyByOAuth('apple', user.sub);
      if (existingKey) {
        showDashboard(existingKey.npub);
      } else {
        showCreateKey();
      }
      return;
    }
  }
  
  // Check for existing session
  const session = getSession();
  if (session?.userId) {
    currentUser = session;
    const key = await getKeyByOAuth(session.provider, session.sub);
    if (key) {
      showDashboard(key.npub);
    } else {
      showCreateKey();
    }
  } else {
    showWelcome();
  }
}

// Always show welcome first, then init
showWelcome();
init().catch(err => {
  console.error('Init error:', err);
  alert('Error initializing: ' + err.message);
});
