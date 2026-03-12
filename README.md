# Nostr Key Bridge

⚡🔒 **Master key + revocable sub-keys (NIP-26 delegation)**

A self-hosted, zero-server tool for managing nostr keys with delegation. Create sub-keys for apps that can sign as you, but revoke them anytime.

---

## 🎯 What It Does

| Feature | Benefit |
|---------|---------|
| **Master Key** | Your root identity, kept secret |
| **Sub-Keys** | Give to apps, they sign as you |
| **Revocation** | Compromised? Revoke instantly |
| **Zero Server** | Everything in your browser |
| **Self-Hosted** | You control the code |

---

## 🚀 Quick Start (GitHub Pages)

### Step 1: Fork This Repo

Click the **Fork** button at the top of this page.

### Step 2: Enable GitHub Pages

1. Go to your forked repo on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch, **/ (root)** folder
5. Click **Save**

### Step 3: Access Your Instance

Wait 1-2 minutes, then visit:
```
https://yourname.github.io/nostr-key-bridge
```

**Done!** Your own instance is live.

---

## 🏠 Self-Hosting Options

### Option A: Netlify (Free, Drag & Drop)

1. Go to https://app.netlify.com/drop
2. Drag `index.html` onto the page
3. Get instant URL

### Option B: Vercel (Free, CLI)

```bash
npm i -g vercel
vercel --prod
```

### Option C: Your Own Server

**Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name keys.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/keys.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/keys.yourdomain.com/privkey.pem;
    
    root /var/www/nostr-key-bridge;
    index index.html;
}
```

**Get SSL:**
```bash
sudo certbot --nginx -d keys.yourdomain.com
```

---

## 🔐 Security

### What the Host Sees

| Data | Visible? |
|------|----------|
| Your keys | ❌ No (encrypted in browser) |
| Your PIN | ❌ No (never sent) |
| IP address | ✅ Yes (standard web) |

**Self-host if you don't want GitHub seeing your IP patterns.**

### Code Verification

```bash
# Download and inspect
curl -o nostr-key-bridge.html https://yourname.github.io/nostr-key-bridge/index.html

# Check no external requests
grep -E "fetch\|XMLHttpRequest\|WebSocket" nostr-key-bridge.html
# Should return nothing
```

**Fully auditable.** No minification, plain readable JavaScript.

---

## 📖 Usage

### Create Master Key
1. Set PIN (8+ digits)
2. Download backup JSON
3. Store securely

### Create Sub-Key
1. Enter app name
2. Enter master PIN
3. Copy sub-key nsec to app
4. App can now sign as you

### Revoke Sub-Key
1. Go to "Manage Sub-Keys"
2. Click "Revoke" on compromised key
3. Create new sub-key for app

### Restore
- **From JSON:** Paste backup + PIN
- **From nsec:** Paste nsec + new PIN

---

## 🎨 Branding

Visual identity:
- ⚡🔒 Lightning + Padlock icon
- Electric blue (#00d4ff) + Bitcoin orange (#ff9500)
- Clean, minimal UI

---

## 🤝 Contributing

1. Fork the repo
2. Make changes
3. Test locally
4. Submit PR

---

## 📄 License

MIT — Open source, no restrictions.

---

## 🔗 Links

- **Live Demo:** https://yourname.github.io/nostr-key-bridge
- **Nostr:** `npub1...` (your npub)
- **Issues:** GitHub Issues

---

**Built for sovereignty. Designed for humans.** 🦞
