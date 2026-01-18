# cbTARO - Farcaster Mini App Integration

Complete integration of Farcaster Mini Apps functionality into cbTARO.

## 📚 Official Documentation

- **Getting Started**: https://miniapps.farcaster.xyz/docs/getting-started
- **Loading / ready()**: https://miniapps.farcaster.xyz/docs/guides/loading
- **Wallets**: https://miniapps.farcaster.xyz/docs/guides/wallets
- **Sharing**: https://miniapps.farcaster.xyz/docs/guides/sharing
- **Share Extension**: https://miniapps.farcaster.xyz/docs/guides/share-extension
- **Publishing / Manifest**: https://miniapps.farcaster.xyz/docs/guides/publishing
- **SDK Reference**: https://miniapps.farcaster.xyz/docs/sdk

---

## 🗂️ File Structure

```
cbTARO/
├── index.html                      # Main app with Farcaster UI integration
├── miniapp.js                      # Farcaster SDK integration module
├── share/
│   └── index.html                  # Share Extension endpoint
├── .well-known/
│   └── farcaster.json             # Mini App manifest
├── .nojekyll                       # GitHub Pages config
├── i.png                          # App icon (1:1 ratio)
├── s.png                          # Splash screen image
└── og.png                         # Open Graph / share image
```

---

## 🚀 Features Implemented

### ✅ 1. Environment Detection
- Detects if running inside Farcaster Mini App or standalone web
- Uses `sdk.isInMiniApp()` API
- Graceful degradation for standalone mode

### ✅ 2. Ready Signal
- Calls `sdk.actions.ready()` exactly once when in Mini App
- Dismisses splash screen after UI renders
- Guard prevents duplicate calls
- **CRITICAL**: Must be called or splash screen persists

### ✅ 3. Farcaster Context
- Loads user information (fid, username, displayName, pfpUrl)
- Displays user identity in UI when available
- Uses `sdk.context` API

### ✅ 4. Native Wallet Connection
- EIP-1193 compatible Ethereum provider
- `eth_requestAccounts` for wallet connection
- `eth_accounts` for current address
- Uses `sdk.wallet.getEthereumProvider()`

### ✅ 5. Native Payments (Tips)
- Uses `sdk.actions.sendToken()` API
- Supports native ETH on Base (chainId 8453)
- CAIP-19 token format: `eip155:8453/slip44:60`
- Recipient: `0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6`
- Three preset amounts: Small (0.0001 ETH), Medium (0.0005 ETH), Large (0.001 ETH)

### ✅ 6. Social Sharing
- Native Farcaster composer via `sdk.actions.composeCast()`
- Embeds app URL in casts
- Clipboard fallback for standalone mode
- Custom share text based on user's reading

### ✅ 7. Share Extension
- Dedicated `/share` endpoint for cast sharing
- Parses `castHash`, `castFid`, `viewerFid` params
- Stores context in sessionStorage
- Calls `ready()` independently

---

## 🔌 Global API: `window.fc`

The `miniapp.js` module exposes a minimal global API:

```javascript
window.fc = {
  // Environment
  isInMiniApp()              // Check if in Mini App
  
  // Core
  callReady()                // Call sdk.actions.ready()
  
  // Context
  getFarcasterContext()      // Get user info (fid, username, etc.)
  
  // Wallet
  connectWallet()            // Request wallet connection
  getWalletAddress()         // Get current address
  getProvider()              // Get EIP-1193 provider
  
  // Payments
  sendTip(amountEth)         // Send ETH tip on Base
  
  // Sharing
  shareApp(text, embeds)     // Open Farcaster composer
  
  // State
  getState()                 // Get current state (read-only)
}
```

---

## 📦 Manifest & Domain Association

### Current Status
- Manifest exists at: `/cbTARO/.well-known/farcaster.json`
- This location is **for reference only**
- Does **NOT** satisfy domain association requirement

### ⚠️ CRITICAL: Domain Association

**Problem**: 
- `accountAssociation.payload.domain` is `0xagcheth.github.io`
- Manifest MUST be at: `https://0xagcheth.github.io/.well-known/farcaster.json`
- This repo is a **Project Page** at `/cbTARO/`, cannot serve root domain files

**Solution**:
1. Create a **separate repository** named: `0xagcheth.github.io`
2. Publish as GitHub Pages **User Site**
3. Copy `/cbTARO/.well-known/farcaster.json` to root of new repo
4. Add `.nojekyll` file to new repo
5. Deploy

**Reference**: https://miniapps.farcaster.xyz/docs/guides/publishing

### Manifest Structure

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "miniapp": {
    "version": "1",
    "name": "cbTARO",
    "homeUrl": "https://0xagcheth.github.io/cbTARO/",
    "iconUrl": "https://0xagcheth.github.io/cbTARO/i.png",
    "splashImageUrl": "https://0xagcheth.github.io/cbTARO/s.png",
    "splashBackgroundColor": "#0b1020",
    "castShareUrl": "https://0xagcheth.github.io/cbTARO/share",
    ...
  }
}
```

---

## 🧪 Testing

### 1. Test in Farcaster Developer Preview

**URL**: https://warpcast.com/~/developers/preview

**Steps**:
1. Enter app URL: `https://0xagcheth.github.io/cbTARO/`
2. Click "Preview"

**Expected Behavior**:
- ✅ Splash screen appears with `s.png` image
- ✅ Splash screen **quickly disappears** (not infinite)
- ✅ App content loads
- ✅ Console shows: `[cbTARO] ✅ sdk.actions.ready() called successfully`
- ✅ User identity bar shows (if logged in)
- ❌ **NO** "Ready not called" error

### 2. Test Wallet Connection

**Steps**:
1. Click "Connect Wallet" button
2. Approve in Farcaster client

**Expected**:
- ✅ Wallet address displayed
- ✅ Console shows: `[cbTARO] Wallet connected: 0x...`

### 3. Test Payment Flow

**Steps**:
1. Click "Tip" button (gift icon)
2. Select amount (Small/Medium/Large)
3. Approve transaction

**Expected**:
- ✅ Native Farcaster payment sheet opens
- ✅ Transaction details show:
  - Recipient: `0xD4bF...54A6`
  - Amount: 0.0001/0.0005/0.001 ETH
  - Network: Base
- ✅ On success: "Tip sent!" message

### 4. Test Sharing

**Steps**:
1. Draw some taro cards
2. Click "Share" button (share icon)

**Expected**:
- ✅ Farcaster composer opens
- ✅ Pre-filled text: "🔮 I just got a mystical taro reading..."
- ✅ App URL embedded
- ✅ Can edit and cast

### 5. Test Share Extension

**URL**: `https://0xagcheth.github.io/cbTARO/share?castHash=0x123&castFid=456&viewerFid=789`

**Expected**:
- ✅ Page loads
- ✅ Shows parsed params
- ✅ "Back to cbTARO" button works
- ✅ Splash dismisses (if in Mini App)

### 6. Test Standalone Web

**URL**: `https://0xagcheth.github.io/cbTARO/` (in regular browser)

**Expected**:
- ✅ App works normally
- ✅ Console shows: `[cbTARO] Environment: 🌐 Standalone Web`
- ✅ Farcaster features degrade gracefully (no errors)
- ✅ Share button copies to clipboard

---

## 🛠️ Deployment Checklist

- [x] `miniapp.js` created and committed
- [x] `share/index.html` created
- [x] `.nojekyll` exists at repo root
- [x] Required images at root: `i.png`, `s.png`, `og.png`
- [x] Manifest at `/.well-known/farcaster.json`
- [x] `index.html` loads `miniapp.js` as module
- [x] UI buttons wired to `window.fc` API
- [ ] **TODO**: Create `0xagcheth.github.io` user site for manifest
- [ ] **TODO**: Deploy manifest to root domain
- [ ] **TODO**: Verify manifest at Farcaster Developer Tools

---

## 🔍 Verification URLs

### Farcaster Developer Tools

**Manifest Tool**: https://warpcast.com/~/developers/manifest
- URL: `https://0xagcheth.github.io/.well-known/farcaster.json`
- Expected: ✅ Manifest valid (after user site setup)

**Embed Tool**: https://warpcast.com/~/developers/embeds
- URL: `https://0xagcheth.github.io/cbTARO/`
- Expected: ✅ Embed preview shows

**Developer Preview**: https://warpcast.com/~/developers/preview
- URL: `https://0xagcheth.github.io/cbTARO/`
- Expected: ✅ App opens in Mini App container

---

## 🐛 Troubleshooting

### Infinite Splash Screen

**Problem**: Splash screen never dismisses

**Cause**: `sdk.actions.ready()` not called

**Fix**: 
1. Check console for `[cbTARO] ✅ sdk.actions.ready() called successfully`
2. If missing, ensure `miniapp.js` loaded correctly
3. Check for JavaScript errors preventing init

### Wallet Not Connecting

**Problem**: "Connect Wallet" does nothing

**Cause**: Not in Farcaster Mini App environment

**Fix**: Test in Farcaster Developer Preview, not regular browser

### Payment Fails

**Problem**: `sendToken` returns error

**Causes**:
1. Not on Base network
2. Insufficient balance
3. User rejected transaction

**Fix**: Check console logs for specific error

### Share Button Copies Instead of Opening Composer

**Problem**: Share copies to clipboard instead of opening Farcaster

**Cause**: Running in standalone browser, not Mini App

**Expected**: This is correct fallback behavior

---

## 📖 Code Examples

### Using window.fc in React Components

```javascript
// Check environment
const [inMiniApp, setInMiniApp] = useState(false);

useEffect(() => {
  const checkEnv = async () => {
    if (window.fc?.isInMiniApp) {
      const result = await window.fc.isInMiniApp();
      setInMiniApp(result);
    }
  };
  checkEnv();
}, []);

// Connect wallet
const handleConnect = async () => {
  if (!window.fc?.connectWallet) return;
  const result = await window.fc.connectWallet();
  if (result.success) {
    console.log('Connected:', result.address);
  }
};

// Send tip
const handleTip = async (amount) => {
  if (!window.fc?.sendTip) return;
  const result = await window.fc.sendTip(amount);
  if (result.success) {
    console.log('Tip sent:', result.txHash);
  }
};

// Share
const handleShare = async () => {
  if (!window.fc?.shareApp) return;
  const text = '🔮 Check out my taro reading!';
  const result = await window.fc.shareApp(text);
  if (result.success) {
    console.log('Shared successfully');
  }
};
```

---

## 📝 Notes

- **SDK Version**: Pinned to `@0.0.59` for stability
- **Chain**: Base mainnet (chainId 8453)
- **Recipient**: `0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6`
- **No Build Step**: Pure static HTML/JS, works on GitHub Pages
- **Graceful Degradation**: All features work or degrade safely in standalone mode

---

## 🔗 Resources

- **Farcaster Mini Apps Docs**: https://miniapps.farcaster.xyz/
- **SDK GitHub**: https://github.com/farcasterxyz/miniapp-sdk
- **Developer Tools**: https://warpcast.com/~/developers
- **Support**: Farcaster Developer Discord

---

**Last Updated**: 2026-01-18
