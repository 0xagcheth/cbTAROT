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

**The Issue with GitHub Pages Project Sites:**

This repository (`cbTARO`) is deployed as a GitHub Pages **PROJECT PAGE** at:
```
https://0xagcheth.github.io/cbTARO/
```

However, the `accountAssociation.payload` domain is:
```
0xagcheth.github.io
```

This means the manifest **MUST** be accessible at:
```
https://0xagcheth.github.io/.well-known/farcaster.json
```

**Project pages CANNOT serve files at the root domain** (`/.well-known`). The cbTARO repository can only serve files under `/cbTARO/`.

### Solution: Create a User GitHub Pages Site

You must create a **separate repository** to host the manifest at the root domain.

#### Step-by-Step Instructions:

1. **Create a new repository** named exactly:
   ```
   0xagcheth.github.io
   ```

2. **In that repository**, create the folder structure:
   ```
   .well-known/
   └── farcaster.json
   ```

3. **Copy the manifest content** from this repo's `.well-known/farcaster.json` into the new repository.

4. **Update the accountAssociation** with your actual signed credentials:
   - Generate using Warpcast or Farcaster developer tools
   - The `payload` domain must be `0xagcheth.github.io`
   - DO NOT regenerate if you already have valid credentials

5. **Enable GitHub Pages** on the `0xagcheth.github.io` repository:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root

6. **Verify the manifest** is accessible at:
   ```
   https://0xagcheth.github.io/.well-known/farcaster.json
   ```

### Manifest Structure

```json
{
  "accountAssociation": {
    "header": "<base64-encoded-header>",
    "payload": "<base64-encoded-payload-with-domain>",
    "signature": "<signature>"
  },
  "frame": {
    "version": "1",
    "name": "cbTARO",
    "iconUrl": "https://0xagcheth.github.io/cbTARO/Assets/imagine/i.png",
    "homeUrl": "https://0xagcheth.github.io/cbTARO/",
    "imageUrl": "https://0xagcheth.github.io/cbTARO/Assets/imagine/f.png",
    "buttonTitle": "Get Taro Reading",
    "splashImageUrl": "https://0xagcheth.github.io/cbTARO/Assets/imagine/s.png",
    "splashBackgroundColor": "#1a0a2e",
    "webhookUrl": ""
  }
}
```

---

## Verification URLs

After setup, verify your configuration:

| What | URL |
|------|-----|
| Manifest | https://0xagcheth.github.io/.well-known/farcaster.json |
| Main App | https://0xagcheth.github.io/cbTARO/ |
| Share Extension | https://0xagcheth.github.io/cbTARO/share/ |
| OG Image | https://0xagcheth.github.io/cbTARO/Assets/imagine/f.png |
| App Icon | https://0xagcheth.github.io/cbTARO/Assets/imagine/i.png |
| Splash Image | https://0xagcheth.github.io/cbTARO/Assets/imagine/s.png |

---

## Testing Inside Farcaster

### Method 1: Warpcast Developer Tools

1. Open Warpcast on mobile
2. Go to Settings → Developer → Frames Developer Tools
3. Enter your Mini App URL: `https://0xagcheth.github.io/cbTARO/`
4. Test the app behavior

### Method 2: Direct Link in Cast

1. Create a cast containing your app URL
2. The Mini App should render as an embed
3. Tap to open in full Mini App view

### Method 3: Frame Debugger

Use the Farcaster Frame Debugger:
https://warpcast.com/~/developers/frames

---

## Manual Test Checklist

- [ ] **Manifest Accessible**: `/.well-known/farcaster.json` returns valid JSON
- [ ] **Meta Tags Present**: `fc:miniapp` meta tag in `<head>`
- [ ] **SDK Initialization**: No console errors on load
- [ ] **Ready Signal**: Splash screen dismisses properly
- [ ] **User Context**: User identity displays when in Mini App
- [ ] **Share Button**: Opens Farcaster cast composer (or copies to clipboard outside Mini App)
- [ ] **Tip Button**: Opens payment UI with 3 preset amounts
- [ ] **Wallet Connection**: Connect wallet works (if outside sendToken flow)
- [ ] **Share Extension**: `/share` page loads and shows cast context
- [ ] **Standalone Mode**: App works normally in regular browser

---

## Project Structure

```
cbTARO/
├── index.html          # Main app (React + Babel)
├── miniapp.js          # Farcaster SDK integration module
├── share/
│   └── index.html      # Cast Share Extension endpoint
├── .well-known/
│   └── farcaster.json  # Mini App manifest (needs root domain hosting)
├── Assets/
│   ├── audio/          # Sound effects
│   └── imagine/        # Images and card art
│       ├── b.png       # Background
│       ├── bc.png      # Card back
│       ├── f.png       # Frame/OG image
│       ├── i.png       # App icon
│       ├── s.png       # Splash image
│       ├── cr.png      # Custom reading button
│       └── taro_cards/ # All 78 card images
└── README.md           # This file
```

---

## SDK Integration Details

### Environment Detection

```javascript
import { sdk, isInMiniApp } from 'https://esm.sh/@farcaster/miniapp-sdk';

const inMiniApp = await isInMiniApp();
```

### Ready Signal

**CRITICAL**: Call `sdk.actions.ready()` AFTER your UI is fully rendered to dismiss the splash screen.

```javascript
await sdk.actions.ready();
```

### User Context

```javascript
const context = sdk.context;
if (context && context.user) {
  console.log(context.user.fid);        // Farcaster ID
  console.log(context.user.username);   // Username
  console.log(context.user.displayName); // Display name
  console.log(context.user.pfpUrl);     // Profile picture URL
}
```

### Authentication (Client-Side Demo)

For static apps without a backend, authentication is demonstrative only:

```javascript
// Quick Auth - returns JWT token
const { token } = await sdk.quickAuth.getToken();

// Sign In with Farcaster
const { signature, message } = await sdk.actions.signIn({
  nonce: 'random-string',
  acceptAuthAddress: true
});
```

### Payments

```javascript
// Using native sendToken (preferred)
await sdk.actions.sendToken({
  recipientAddress: '0x...',
  amount: '1000000000000000', // wei
  // token: 'eip155:8453/erc20:0x...' // for ERC20
});

// Fallback: EIP-1193 provider
const provider = await sdk.wallet.getEthereumProvider();
await provider.request({
  method: 'eth_sendTransaction',
  params: [{ from, to, value }]
});
```

### Sharing

```javascript
await sdk.actions.composeCast({
  text: 'Check out my taro reading!',
  embeds: ['https://0xagcheth.github.io/cbTARO/']
});
```

---

## Documentation References

- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [Publishing Guide](https://miniapps.farcaster.xyz/docs/guides/publishing)
- [SDK Reference](https://miniapps.farcaster.xyz/docs/sdk)
- [Authentication](https://miniapps.farcaster.xyz/docs/guides/auth)
- [Wallet Integration](https://miniapps.farcaster.xyz/docs/guides/wallets)
- [Sharing](https://miniapps.farcaster.xyz/docs/guides/sharing)
- [Share Extension](https://miniapps.farcaster.xyz/docs/guides/share-extension)
- [GitHub Pages](https://docs.github.com/en/pages)

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
