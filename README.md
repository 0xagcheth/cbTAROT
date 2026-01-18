# cbTARO - Mystical Taro Reading

A Farcaster Mini App for AI-powered mystical taro readings. Works inside Farcaster clients (Warpcast, Base App) and as a standalone website.

**Live Demo:** https://0xagcheth.github.io/cbTARO/

---

## Features

- **Single Card Reading**: Quick daily guidance
- **Three Card Spread**: Past/Present/Future or Today's Energy/Support/Challenge
- **Custom AI Reading**: Ask any question and receive personalized AI-powered interpretations
- **Full 78-Card Deck**: Complete Major and Minor Arcana with detailed meanings
- **Card Gallery**: Browse all taro cards and their descriptions

### Farcaster Mini App Features

- **Share to Farcaster**: Compose casts with your reading results
- **Tip the Creator**: Send ETH tips on Base network
- **User Identity**: Shows your Farcaster profile when in Mini App
- **Cast Share Extension**: Open from shared casts via `/share` endpoint

---

## Farcaster Mini App Setup

### Two Components Required

Farcaster Mini Apps need **two things** to work:

| Component | Purpose | Location |
|-----------|---------|----------|
| **Embed Meta Tag** | Shows preview in Farcaster feed | `<meta name="fc:miniapp">` in HTML `<head>` |
| **Manifest File** | Domain verification & app config | `https://<domain>/.well-known/farcaster.json` |

### Component 1: Embed Meta Tag (DONE in this repo)

The `fc:miniapp` meta tag in `index.html` contains stringified JSON per spec:
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"...","button":{...}}' />
```

**Test the embed** using Farcaster Embed Tool:
```
https://warpcast.com/~/developers/embeds?url=https://0xagcheth.github.io/cbTARO/
```

### Component 2: Domain Manifest (REQUIRES SEPARATE REPO)

The manifest **MUST** be at the root domain because `accountAssociation.payload` specifies:
```
domain: "0xagcheth.github.io"
```

Therefore it must be served at:
```
https://0xagcheth.github.io/.well-known/farcaster.json
```

**Test the manifest** using Farcaster Manifest Tool:
```
https://warpcast.com/~/developers/manifest?domain=0xagcheth.github.io
```

---

### WHY THIS REPO CANNOT HOST THE MANIFEST

This repo (`cbTARO`) is a GitHub Pages **PROJECT PAGE**:
```
https://0xagcheth.github.io/cbTARO/
```

Project pages can only serve files under `/cbTARO/`. They **cannot** serve files at the root domain (`/.well-known/`).

---

### SOLUTION: Create a User GitHub Pages Site

You must create a **separate repository** named exactly `0xagcheth.github.io`:

#### Step 1: Create the Repository

1. Go to https://github.com/new
2. Repository name: `0xagcheth.github.io` (exactly this)
3. Make it **Public**
4. Initialize with a README (optional)

#### Step 2: Add Required Files

Create these files in the new repo:

**File: `.nojekyll`** (empty file)
```
(no content - just create an empty file)
```

**File: `.well-known/farcaster.json`**
```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjIxMDUxLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4RTM2NmQ2QTNiRTliNkM5NDI4MjBENzUzNjcwY0ZjMDA5NjMwODdEMCJ9",
    "payload": "eyJkb21haW4iOiIweGFnY2hldGguZ2l0aHViLmlvIn0",
    "signature": "aXwD4QtCu7BgjxmwDT/ZXDB8ebe6rUCElNgM0wjGvlV7Yj4HQTbofutI299kPpfQvoB6Shpj117ePpFxyfDRSxs="
  },
  "miniapp": {
    "version": "1",
    "name": "cbTARO",
    "homeUrl": "https://0xagcheth.github.io/cbTARO/",
    "iconUrl": "https://0xagcheth.github.io/cbTARO/i.png",
    "splashImageUrl": "https://0xagcheth.github.io/cbTARO/s.png",
    "splashBackgroundColor": "#0b1020",
    "subtitle": "Mystical taro reading on Base",
    "description": "Draw taro cards, explore interpretations, and share your reading on Farcaster.",
    "primaryCategory": "games",
    "tags": ["taro", "cards", "mystic", "base", "farcaster"],
    "tagline": "Reveal your Taro",
    "ogTitle": "cbTARO — Onchain Taro Reading",
    "ogDescription": "Draw a taro card and share your mystical reading on Farcaster.",
    "ogImageUrl": "https://0xagcheth.github.io/cbTARO/og.png",
    "buttonTitle": "Open cbTARO",
    "imageUrl": "https://0xagcheth.github.io/cbTARO/og.png",
    "castShareUrl": "https://0xagcheth.github.io/cbTARO/share"
  }
}
```

#### Step 3: Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **main** (or master)
4. Folder: **/ (root)**
5. Click **Save**

#### Step 4: Wait for Deployment

GitHub Pages takes 1-2 minutes to deploy. Check the Actions tab for status.

#### Step 5: Verify

Test both URLs:
```
https://0xagcheth.github.io/.well-known/farcaster.json
https://warpcast.com/~/developers/manifest?domain=0xagcheth.github.io
```

---

### Why .nojekyll is Required

GitHub Pages uses Jekyll by default, which **ignores** files/directories starting with `.` (like `.well-known`).

The `.nojekyll` file disables Jekyll, ensuring `.well-known` is served.

**Both repos need `.nojekyll`:**
- `0xagcheth.github.io` repo ← YOU MUST CREATE THIS
- `cbTARO` repo ← already included

---

### Convenience Copy in This Repo

This repo has a copy of the manifest at:
```
https://0xagcheth.github.io/cbTARO/.well-known/farcaster.json
```

**This does NOT satisfy domain verification.** It's only for reference.

---

## Manifest Structure

The manifest uses the `miniapp` configuration (not `frame`):

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjIxMDUxLC...",
    "payload": "eyJkb21haW4iOiIweGFnY2hldGguZ2l0aHViLmlvIn0",
    "signature": "aXwD4QtCu7BgjxmwDT/ZXDB8ebe..."
  },
  "miniapp": {
    "version": "1",
    "name": "cbTARO",
    "homeUrl": "https://0xagcheth.github.io/cbTARO/",
    "iconUrl": "https://0xagcheth.github.io/cbTARO/i.png",
    "splashImageUrl": "https://0xagcheth.github.io/cbTARO/s.png",
    "splashBackgroundColor": "#0b1020",
    "subtitle": "Mystical taro reading on Base",
    "description": "Draw taro cards, explore interpretations, and share your reading on Farcaster.",
    "primaryCategory": "games",
    "tags": ["taro", "cards", "mystic", "base", "farcaster"],
    "tagline": "Reveal your Taro",
    "ogTitle": "cbTARO — Onchain Taro Reading",
    "ogDescription": "Draw a taro card and share your mystical reading on Farcaster.",
    "ogImageUrl": "https://0xagcheth.github.io/cbTARO/og.png",
    "buttonTitle": "Open cbTARO",
    "imageUrl": "https://0xagcheth.github.io/cbTARO/og.png",
    "castShareUrl": "https://0xagcheth.github.io/cbTARO/share"
  }
}
```

---

## Verification URLs

After setup, verify your configuration:

| What | URL |
|------|-----|
| **Manifest (REQUIRED)** | https://0xagcheth.github.io/.well-known/farcaster.json |
| Main App | https://0xagcheth.github.io/cbTARO/ |
| Share Extension | https://0xagcheth.github.io/cbTARO/share |
| OG Image | https://0xagcheth.github.io/cbTARO/og.png |
| App Icon | https://0xagcheth.github.io/cbTARO/i.png |
| Splash Image | https://0xagcheth.github.io/cbTARO/s.png |

---

## Testing Inside Farcaster

### Method 1: Warpcast Developer Tools

1. Open Warpcast on mobile
2. Go to Settings → Developer → Mini Apps Developer Tools
3. Enter your Mini App URL: `https://0xagcheth.github.io/cbTARO/`
4. Test the app behavior

### Method 2: Direct Link in Cast

1. Create a cast containing your app URL
2. The Mini App should render as an embed
3. Tap to open in full Mini App view

---

## Testing Checklist

Before publishing, verify:

- [ ] **`.nojekyll` present** in both repos (cbTARO and 0xagcheth.github.io)
- [ ] **Manifest accessible** at `https://0xagcheth.github.io/.well-known/farcaster.json`
- [ ] **Share page loads** at `https://0xagcheth.github.io/cbTARO/share` (valid HTML)
- [ ] **SDK ready() works**: Splash screen dismisses in Mini App
- [ ] **Share button**: Opens Farcaster cast composer (or copies to clipboard outside Mini App)
- [ ] **Tip button**: Triggers sendToken with proper result handling
- [ ] **Connect Wallet**: Shows connected address
- [ ] **User identity**: Displays when inside Mini App
- [ ] **Standalone mode**: App works normally in regular browser

---

## Required Image Files

The manifest references these image files at the root level. **You must create/copy them:**

| File | Purpose | Recommended Size |
|------|---------|------------------|
| `i.png` | App icon | 200x200 px |
| `s.png` | Splash screen image | 200x200 px |
| `og.png` | Open Graph / embed image | 1200x630 px |

You can copy from `Assets/imagine/` or create new optimized versions:
```bash
cp Assets/imagine/i.png ./i.png
cp Assets/imagine/s.png ./s.png
cp Assets/imagine/f.png ./og.png
```

---

## Project Structure

```
cbTARO/
├── index.html              # Main app (React + Babel)
├── miniapp.js              # Farcaster SDK integration module
├── .nojekyll               # Disables Jekyll for GitHub Pages
├── share/
│   └── index.html          # Cast Share Extension endpoint (castShareUrl)
├── .well-known/
│   └── farcaster.json      # Mini App manifest (convenience copy)
├── i.png                   # App icon (REQUIRED - copy from Assets)
├── s.png                   # Splash image (REQUIRED - copy from Assets)
├── og.png                  # OG image (REQUIRED - copy from Assets)
├── Assets/
│   ├── audio/              # Sound effects
│   └── imagine/            # Images and card art
│       └── taro_cards/     # All 78 card images
└── README.md               # This file
```

---

## SDK Integration Details

### Environment Detection

```javascript
import { sdk, isInMiniApp } from 'https://esm.sh/@farcaster/miniapp-sdk';

const inMiniApp = await isInMiniApp();
```

### Ready Signal

**CRITICAL**: Call `sdk.actions.ready()` AFTER your UI is fully rendered to dismiss the splash screen. Only call it once.

```javascript
// Check if action exists before calling
if (sdk.actions && typeof sdk.actions.ready === 'function') {
  await sdk.actions.ready();
}
```

### Payments (sendToken)

The `sendToken` action returns a result object:

```javascript
const result = await sdk.actions.sendToken({
  recipientAddress: '0x...',
  amount: '1000000000000000' // wei as string
});

if (result.success) {
  console.log('Transaction:', result.transactionHash);
} else {
  // result.reason: 'rejected_by_user' | 'send_failed' | etc.
  console.log('Failed:', result.reason);
}
```

### Sharing (composeCast)

```javascript
await sdk.actions.composeCast({
  text: 'Check out my taro reading!',
  embeds: ['https://0xagcheth.github.io/cbTARO/'] // absolute URLs only
});
```

---

## Documentation References

- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [Publishing Guide](https://miniapps.farcaster.xyz/docs/guides/publishing)
- [Manifest vs Embed](https://miniapps.farcaster.xyz/docs/guides/manifest-vs-embed)
- [Loading / ready()](https://miniapps.farcaster.xyz/docs/guides/loading)
- [Share Extension](https://miniapps.farcaster.xyz/docs/guides/share-extension)
- [Wallets](https://miniapps.farcaster.xyz/docs/guides/wallets)
- [sendToken](https://miniapps.farcaster.xyz/docs/sdk/actions/send-token)
- [composeCast](https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast)
- [isInMiniApp](https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app)
- [Compatibility](https://miniapps.farcaster.xyz/docs/sdk/compatibility)

---

## Tip Address

Support the mystical arts:
```
0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6
```
(Base network)

---

## License

MIT License - Feel free to use and modify for your own mystical endeavors.
