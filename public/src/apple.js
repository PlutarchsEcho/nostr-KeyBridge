// Apple OAuth utilities for Sign In with Apple

export const APPLE_CONFIG_KEY = 'nkb_apple_client_id';

export function isAppleConfigured() {
  return !!localStorage.getItem(APPLE_CONFIG_KEY);
}

export function configureApple() {
  const clientId = prompt('Enter Apple Services ID:', localStorage.getItem(APPLE_CONFIG_KEY) || '');
  if (clientId?.trim()) {
    localStorage.setItem(APPLE_CONFIG_KEY, clientId.trim());
    alert('Apple Sign In configured!\n\nNote: You also need to configure your domain in Apple Developer portal.');
    return true;
  }
  return false;
}

// Apple uses a different flow - they provide a JS SDK
export function loadAppleScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('apple-auth-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'apple-auth-script';
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function signInWithApple() {
  const clientId = localStorage.getItem(APPLE_CONFIG_KEY);
  if (!clientId) {
    alert('Please configure Apple Services ID first:\n\n1. Go to https://developer.apple.com/\n2. Sign In > Configure\n3. Create Services ID\n4. Add your domain\n5. Return here and click Configure Apple');
    return null;
  }
  
  await loadAppleScript();
  
  return new Promise((resolve, reject) => {
    // Apple Sign In uses popup
    AppleID.auth.init({
      clientId: clientId,
      scope: 'name email',
      redirectURI: window.location.origin + window.location.pathname,
      state: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      usePopup: true
    });
    
    AppleID.auth.signIn().then(res => {
      // Apple returns user info directly (no token exchange needed)
      const user = res.user;
      const auth = res.authorization;
      
      resolve({
        provider: 'apple',
        sub: auth.code, // Apple uses authorization code
        email: user?.email,
        name: user?.name ? `${user.name.firstName} ${user.name.lastName}` : null,
        id_token: auth.id_token
      });
    }).catch(err => {
      reject(err);
    });
  });
}

// For Apple redirect flow (fallback if popup blocked)
export async function handleAppleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const id_token = urlParams.get('id_token');
  const state = urlParams.get('state');
  
  if (!code) return null;
  
  // Verify state to prevent CSRF
  // (In production, validate against stored state)
  
  return {
    provider: 'apple',
    sub: code, // Or extract from id_token
    id_token: id_token,
    email: null // Apple only sends email in first sign-in
  };
}
