# ⚡🔒 Nostr Key Ceremony

**Generate your nostr keys with intention**

A beautiful, ceremonial key generation experience for nostr. Collect entropy, watch your key being forged, and secure it with encrypted backups.

**[Try it now →](https://plutarchsecho.github.io/nostr-KeyBridge)**

---

## ✨ Features

| Feature | What It Does |
|---------|-------------|
| **Entropy Collection** | Move mouse, type random keys, or auto-fill to add your randomness |
| **Visual Mining** | Watch secp256k1 elliptic curve cryptography in action |
| **Encrypted Backups** | AES-256-GCM encryption with PBKDF2 password derivation |
| **Remote Signer Links** | Direct links to NIP-46 bunkers for secure signing |
| **Self-Hosted** | One HTML file, zero server, you control everything |

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

**Done!** Your own ceremony is live.

---

## 🎭 The Ceremony

### Step 1: Provide Entropy
Move your mouse, type random characters, or click auto-fill. Your randomness makes the key truly yours.

### Step 2: Watch Mining
Visual animation of secp256k1 key generation. 256 bits of entropy forged into your unique identity.

### Step 3: Reveal & Backup
Your nsec appears with ritual solemnity. Download encrypted backup (with password) or plain JSON. Links to NIP-46 remote signers included.

---

## 🔐 Security

### Encrypted Backups
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Format:** JSON with base64-encoded salt, IV, and ciphertext

### What the Host Sees
| Data | Visible? |
|------|----------|
| Your keys | ❌ No (never leaves your browser) |
| Your password | ❌ No (only used for encryption) |
| IP address | ✅ Yes (standard web) |

**Self-host if you don't want GitHub seeing your IP patterns.**

---

## 🔗 Remote Signers (NIP-46)

Never expose your nsec to apps again. Use these bunkers:

- **[nsecBunker.com](https://nsecbunker.com)** — Hosted bunker service
- **[Nostr Connect](https://github.com/nostr-connect/nostr-connect)** — Protocol spec
- **[Blowater](https://git.njump.io/fiatjaf/blowater)** — Self-hosted option

---

## 🏠 Self-Hosting Options

### Netlify (Drag & Drop)
1. Go to https://app.netlify.com/drop
2. Drag `index.html` onto the page
3. Get instant HTTPS URL

### Your Own Server (Nginx)
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

Get free SSL:
```bash
sudo certbot --nginx -d keys.yourdomain.com
```

---

## 🎨 Branding

Visual identity:
- ⚡🔒 Lightning + Padlock icon (from Lightning Lockers)
- Electric blue (#00d4ff) + Bitcoin orange (#ff9500)
- Dark theme with glow effects

---

## 📄 License

MIT — Open source, no restrictions.

---

## 🔗 Links

- **Live Demo:** https://plutarchsecho.github.io/nostr-KeyBridge
- **Issues:** GitHub Issues

---

**Generate with intention. Guard with your life.** 🦞