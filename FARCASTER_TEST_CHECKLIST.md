# cbTARO - Farcaster Mini App Test Checklist

Complete testing guide for Farcaster Mini App integration.

---

## 🧪 TESTING ENVIRONMENT

### Farcaster Developer Preview Tool
**URL**: https://warpcast.com/~/developers/preview

**App URL**: `https://0xagcheth.github.io/cbTARO/`

---

## ✅ TEST 1: READY SIGNAL (CRITICAL)

**Purpose**: Verify splash screen dismisses correctly

**Steps**:
1. Open Developer Preview
2. Enter app URL: `https://0xagcheth.github.io/cbTARO/`
3. Click "Preview"

**Expected Results**:
- ✅ Splash screen shows `s.png` with `#0b1020` background
- ✅ Splash screen **dismisses within 1-2 seconds** (not infinite)
- ✅ App content loads and displays
- ✅ Console shows: `[cbTARO] ✅ ready() called successfully`
- ❌ **NO** "Ready not called" error

**If Fails**:
- Check console for errors
- Verify `miniapp.js` loaded: look for `[cbTARO] miniapp.js loaded ✅`
- Verify `window.fc` exists: type `window.fc` in console

---

## ✅ TEST 2: ENVIRONMENT DETECTION

**Purpose**: Verify app detects Mini App environment

**Steps**:
1. While in Developer Preview, open browser console
2. Check logs

**Expected Results**:
- ✅ Console shows: `[cbTARO] Environment: 🚀 Farcaster Mini App`
- ✅ Console shows: `[cbTARO] Initialization complete ✅`

**Manual Check**:
```javascript
// In console:
window.fc.inMiniApp()  // Should return: true
window.fc.capabilities()  // Should show all available features
```

---

## ✅ TEST 3: CONTEXT (Farcaster Identity)

**Purpose**: Verify Farcaster user context loads

**Steps**:
1. Ensure you're logged into Farcaster
2. Open app in Developer Preview
3. Check console

**Expected Results**:
- ✅ Console shows: `[cbTARO] Context loaded: { fid: ..., username: ... }`
- ✅ If app has identity UI, user info displays

**Manual Check**:
```javascript
// In console:
const ctx = window.fc.context()
console.log(ctx.user)  // Should show: { fid, username, displayName, pfpUrl }
```

---

## ✅ TEST 4: WALLET CONNECTION

**Purpose**: Verify EIP-1193 wallet provider works

**Steps**:
1. Open app in Developer Preview
2. Find and click "Connect Wallet" button
3. Approve connection in Farcaster client

**Expected Results**:
- ✅ Wallet connection prompt appears
- ✅ After approval, wallet address displays in UI
- ✅ Console shows: `[cbTARO] Wallet connected: 0x...`
- ✅ Console shows: `[cbTARO] Ethereum provider loaded ✅`

**Manual Check**:
```javascript
// In console:
await window.fc.connectWallet()  // Should return: { success: true, address: "0x..." }
await window.fc.getAddress()     // Should return: "0x..."
```

---

## ✅ TEST 5: PAYMENT (TIP TO EVM ADDRESS)

**Purpose**: Verify eth_sendTransaction works

**Steps**:
1. Ensure wallet is connected (Test 4)
2. Click "Tip" button (gift icon)
3. Select amount: 0.0001 / 0.001 / 0.01 ETH
4. Approve transaction in Farcaster client

**Expected Results**:
- ✅ Transaction params show:
  - **To**: `0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6`
  - **Amount**: Selected ETH amount
  - **Network**: Base (chainId 8453)
- ✅ Transaction confirmation shows in Farcaster
- ✅ After approval, success message displays
- ✅ Console shows: `[cbTARO] ✅ Transaction sent: 0x...`

**Manual Check**:
```javascript
// In console:
await window.fc.sendTipToAddress('0.0001')
// Should return: { success: true, txHash: "0x...", method: "eth_sendTransaction" }
```

**Verify on Basescan**:
- Open: https://basescan.org/address/0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6
- Check for incoming transaction

---

## ✅ TEST 6: SHARING (COMPOSE CAST)

**Purpose**: Verify composeCast opens Farcaster composer

**Steps**:
1. Draw some taro cards in the app
2. Click "Share" button (share icon)
3. Check Farcaster composer opens

**Expected Results**:
- ✅ Farcaster composer opens
- ✅ Pre-filled text includes: "🔮 I just got a mystical taro reading..."
- ✅ App URL embedded: `https://0xagcheth.github.io/cbTARO/`
- ✅ Can edit text before casting
- ✅ Console shows: `[cbTARO] ✅ Composer opened`

**Manual Check**:
```javascript
// In console:
await window.fc.shareReading({
  text: '🔮 Test share from cbTARO!',
  embedUrl: 'https://0xagcheth.github.io/cbTARO/'
})
// Should return: { success: true }
```

---

## ✅ TEST 7: SHARE EXTENSION

**Purpose**: Verify share extension endpoint works

**Steps**:
1. Open share extension URL with params:
   ```
   https://0xagcheth.github.io/cbTARO/share?castHash=0x123&castFid=456&viewerFid=789
   ```
2. Check page loads
3. Open console

**Expected Results**:
- ✅ Page displays parsed params:
  - Cast Hash: `0x123`
  - Cast FID: `456`
  - Viewer FID: `789`
- ✅ Status shows: "✅ Ready"
- ✅ "Back to cbTARO" button works
- ✅ Console shows: `[cbTARO share] Context stored: { ... }`
- ✅ SessionStorage has key `cbtaro_share_context`

**Manual Check**:
```javascript
// In console:
JSON.parse(sessionStorage.getItem('cbtaro_share_context'))
// Should return: { castHash, castFid, viewerFid, timestamp }
```

---

## ✅ TEST 8: STANDALONE WEB (Graceful Degradation)

**Purpose**: Verify app works outside Farcaster (normal browser)

**Steps**:
1. Open app in **regular browser** (Chrome/Safari):
   ```
   https://0xagcheth.github.io/cbTARO/
   ```
2. Check console
3. Try UI features

**Expected Results**:
- ✅ App loads normally (no errors)
- ✅ Console shows: `[cbTARO] Environment: 🌐 Standalone Web`
- ✅ Taro card drawing works
- ✅ Farcaster features degrade gracefully:
  - "Connect Wallet" does nothing (no error)
  - "Tip" does nothing (no error)
  - "Share" copies to clipboard (fallback)
- ✅ Console shows: `[cbTARO] Not in Mini App, skipping ready()`

---

## 🐛 TROUBLESHOOTING

### Problem: Infinite Splash Screen

**Symptoms**:
- Splash screen never dismisses
- "Ready not called" error in preview tool

**Solutions**:
1. Check console for errors
2. Verify `miniapp.js` loaded: `window.fc` should exist
3. Check network tab: `miniapp.js` should return 200
4. Verify GitHub Pages deployed successfully

### Problem: Wallet Not Connecting

**Symptoms**:
- "Connect Wallet" does nothing
- No prompt appears

**Solutions**:
1. Check you're in Developer Preview (not regular browser)
2. Check console: `window.fc.capabilities().wallet` should be `true`
3. Try manual connection: `await window.fc.connectWallet()`

### Problem: Payment Fails

**Symptoms**:
- Transaction rejected
- Error message displays

**Common Causes**:
1. **Insufficient balance** - Check wallet has enough ETH + gas
2. **Wrong network** - Should be on Base (chainId 8453)
3. **User rejected** - Check Farcaster transaction prompt

### Problem: Share Copies Instead of Opens Composer

**Symptoms**:
- "Share" button copies to clipboard
- No composer opens

**Explanation**:
- This is **correct behavior** in standalone browser
- composeCast only works in Mini App environment
- Clipboard is the fallback

---

## 📊 QUICK VERIFICATION COMMANDS

Run these in browser console while in Developer Preview:

```javascript
// 1. Check environment
window.fc.inMiniApp()  // Should: true

// 2. Check capabilities
window.fc.capabilities()  // Should: all true in Mini App

// 3. Check context
window.fc.context()  // Should: { user: { fid, username, ... } }

// 4. Check config
window.fc.config.TIP_ADDRESS  // Should: "0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6"

// 5. Test wallet
await window.fc.getAddress()  // Should: "0x..." or null

// 6. Test provider
const provider = await window.fc.getProvider()
provider !== null  // Should: true
```

---

## ✅ COMPLETE CHECKLIST

Before submitting for review, verify ALL tests pass:

- [ ] Test 1: Ready signal (splash dismisses)
- [ ] Test 2: Environment detection (Mini App recognized)
- [ ] Test 3: Context loads (user info available)
- [ ] Test 4: Wallet connects (address displays)
- [ ] Test 5: Payment works (transaction sends to address)
- [ ] Test 6: Sharing works (composer opens)
- [ ] Test 7: Share extension works (params parsed)
- [ ] Test 8: Standalone web works (no errors)

---

## 📖 REFERENCE

### Official Docs
- Getting Started: https://miniapps.farcaster.xyz/docs/getting-started
- Loading/Ready: https://miniapps.farcaster.xyz/docs/guides/loading
- Wallet: https://miniapps.farcaster.xyz/docs/sdk/wallet
- Sharing: https://miniapps.farcaster.xyz/docs/guides/sharing
- Share Extension: https://miniapps.farcaster.xyz/docs/guides/share-extension

### Key URLs
- Developer Preview: https://warpcast.com/~/developers/preview
- Manifest Tool: https://warpcast.com/~/developers/manifest
- Embed Tool: https://warpcast.com/~/developers/embeds

### Recipient Info
- **Address**: `0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6`
- **Network**: Base (chainId 8453)
- **Verify transactions**: https://basescan.org/address/0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6

---

**Last Updated**: 2026-01-18
