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

### CRITICAL: Domain & Manifest Configuration

Farcaster Mini Apps require a manifest at:
```
https://<domain>/.well-known/farcaster.json
```

The `accountAssociation.payload` domain in this app is:
```
0xagcheth.github.io
```

**Therefore, the VALID manifest MUST be hosted at:**
```
https://0xagcheth.github.io/.well-known/farcaster.json
```

### GitHub Pages Limitation

This repository (`cbTARO`) is deployed as a GitHub Pages **PROJECT PAGE** at:
```
https://0xagcheth.github.io/cbTARO/
```

**Project pages CANNOT serve files at the root domain** (`/.well-known`). This repo can only serve files under `/cbTARO/`.

### Solution: Create a User GitHub Pages Site

To satisfy the domain association requirement, you must create a **separate repository**:

#### Step-by-Step Instructions:

1. **Create a new repository** named exactly:
   ```
   0xagcheth.github.io
   ```

2. **In that repository**, create the following files:
   ```
   .nojekyll              # Empty file - required!
   .well-known/
   └── farcaster.json     # Copy from this repo
   ```

3. **Copy the manifest** from this repo's `.well-known/farcaster.json` into the new repository.

4. **Enable GitHub Pages** on the `0xagcheth.github.io` repository:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root

5. **Verify the manifest** is accessible at:
   ```
   https://0xagcheth.github.io/.well-known/farcaster.json
   ```

### Why .nojekyll is Required

GitHub Pages uses Jekyll by default, which ignores files and directories starting with a dot (like `.well-known`). The `.nojekyll` file disables Jekyll processing, ensuring the `.well-known` directory is served correctly.

**Both repositories need `.nojekyll`:**
- `0xagcheth.github.io` repo (for the manifest)
- `cbTARO` repo (already included)

### Convenience Copy in This Repo

This repo includes a copy of the manifest at:
```
https://0xagcheth.github.io/cbTARO/.well-known/farcaster.json
```

**Note:** This copy does NOT satisfy domain association. It is only for reference and testing. The real manifest must be at the root domain.

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
