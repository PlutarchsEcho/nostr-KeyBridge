# Quick Setup Guide

## 1. Run the App (30 seconds)

```bash
cd nostr-key-bridge-pwa
python3 -m http.server 8080 --directory public
```

Open: http://localhost:8080

## 2. Get Google OAuth Credentials (5 minutes)

### Step 1: Google Cloud Console
```
https://console.cloud.google.com/
```

### Step 2: New Project
- Click project dropdown → New Project
- Name: "Nostr Key Bridge"
- Create

### Step 3: Enable OAuth
- APIs & Services → OAuth consent screen
- Choose "External" (for testing)
- Fill in app name, email, developer contact
- Save

### Step 4: Create Credentials
- APIs & Services → Credentials
- Create Credentials → OAuth client ID
- Application type: Web application
- Name: Key Bridge Web
- Authorized origins: Add `http://localhost:8080`
- Create

### Step 5: Copy Client ID
- You'll see: `123456789-xxx.apps.googleusercontent.com`
- Copy this string

## 3. Configure App

1. Open http://localhost:8080
2. Click "Configure Google OAuth"
3. Paste your Client ID
4. Click "Sign in with Google"

## 4. Create Your Key

1. Set a PIN (6-10 digits)
2. Confirm PIN
3. Your nsec is generated and encrypted
4. Write down your npub

## 5. Test Signing

1. Click "Sign Test Event"
2. Enter PIN
3. Signed event appears
4. Copy to nostr relay

## 6. Backup Your Key

⚠️ **CRITICAL**: Download backup before clearing browser data

1. Click "Download Backup"
2. Save JSON file securely
3. This contains your encrypted nsec

## 7. Restore (if needed)

1. Click "Restore from Backup"
2. Paste your backup JSON or raw nsec
3. Set new PIN
4. Key restored

## Troubleshooting

### "Popup blocked"
- Allow popups for localhost
- Or use the redirect flow (should work automatically)

### "Invalid client_id"
- Check that you copied the full Client ID
- Ensure authorized origin matches the URL exactly

### "Database error"
- Clear browser data for localhost
- Refresh page
- Or check browser console for details

### PIN forgotten
- If you have backup: restore from backup
- If no backup: key is lost forever (by design)

## Production Deployment

### Static Hosting

Any static host works:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- S3 + CloudFront

### Requirements

- HTTPS required for production
- OAuth redirect URI must match hosted URL
- Update Google OAuth credentials with production URL

### Build

No build step needed! Just upload `public/` folder.

```bash
rsync -av public/ user@server:/var/www/html/
```

Or drag-and-drop to Netlify/Vercel.

## Apple Sign In

### Step 1: Apple Developer Account
- Requires paid Apple Developer account ($99/year)
- Sign in at https://developer.apple.com/

### Step 2: Configure Sign In with Apple
- Certificates, Identifiers & Profiles → Identifiers
- Click "+" to register a new identifier
- Choose "Services IDs"
- Description: "Nostr Key Bridge"
- Identifier: `com.yourdomain.nostr-bridge`
- Enable "Sign In with Apple"

### Step 3: Add Website URLs
- Primary App ID: Configure later or skip
- Website URLs:
  - Primary: `https://yourdomain.com`
  - Return URLs: `https://yourdomain.com/callback`
- Domains and Subdomains: `yourdomain.com`

### Step 4: Get Client ID
- The Services ID is your Client ID
- Format: `com.yourdomain.nostr-bridge`

### Step 5: Configure App
1. Open app
2. Click "🍎 Apple" config button
3. Enter Services ID
4. Click "🍎 Sign in with Apple"

