    # 🍪 Cookie & Analytics Setup Guide

Quick reference for Predik's GDPR-compliant cookie consent and analytics tracking.

---

## 📦 What's Installed

- **posthog-js** - PostHog analytics SDK for event tracking
- **Google Analytics 4** - GA4 tracking (loaded dynamically via script injection)

---

## 🗂️ File Locations

### Core Files
```
components/layout/CookieConsent.tsx    # Cookie banner & preferences modal
lib/analytics.ts                       # Analytics initialization logic
.env.local                             # Analytics keys (NOT committed to git)
.env.local.example                     # Template for env variables
```

### Configuration
```
app/layout.tsx                         # CookieConsentBanner component rendered here
components/layout/Footer.tsx           # "Cookies" button triggers preferences modal
```

---

## 🔧 How It Works

### 1. **Cookie Banner Flow**
- Shows on first visit (checks `localStorage` for `cookie-consent`)
- User clicks "Aceptar todo" OR "Solo necesarias"
- Choice saved to `localStorage` as JSON:
  ```json
  {
    "necessary": true,
    "analytics": true/false,
    "timestamp": 1234567890
  }
  ```

### 2. **Analytics Initialization**
- If `analytics: true` → initializes Google Analytics + PostHog
- If `analytics: false` → only necessary cookies (consent preference)

### 3. **Preferences Modal**
- Footer "Cookies" button reopens modal
- User can toggle analytics on/off
- Saves new preference and reinitializes if needed

---

## 🔑 Environment Variables

Add to `.env.local` (already configured for dev):

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-3BJTW83QPR

# PostHog (add when ready)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 📊 What Gets Tracked

### Automatic (when analytics accepted):
- ✅ **Page views** - Every page load
- ✅ **Page leaves** - When users exit
- ✅ **Autocapture** - Clicks, form submissions (PostHog)
- ✅ **Device/browser** - User agent, screen size
- ✅ **Location** - Country/region (IP-based)

### Custom Events (not yet implemented):
- ❌ Market views
- ❌ Predictions/bets placed
- ❌ Wallet connections
- ❌ Trading interactions

---

## 🚀 Production Deployment

### Before Going Live:

1. **Get PostHog API Key**
   - Sign up at https://posthog.com
   - Create project → copy API key
   - Add to `.env.local` and production env vars

2. **Verify Google Analytics**
   - Already configured: `G-3BJTW83QPR`
   - Test in GA Realtime view

3. **Update Domain References**
   - Cookie tables show "predik.io" (already set)
   - Privacy policy links work (already set)

4. **Test Flow**
   - Clear `localStorage`
   - Accept cookies
   - Verify console logs: "📊 Google Analytics initialized"
   - Check Network tab for GA/PostHog requests

---

## 🧪 Testing Locally

```javascript
// Browser console:
localStorage.clear()              // Reset consent
location.reload()                 // Show banner again

// After accepting:
localStorage.getItem('cookie-consent')  // Check saved preference
posthog                                 // Verify PostHog loaded (if key added)
```

---

## 📍 Where Data Goes

| Service | Data Destination | View Dashboard |
|---------|-----------------|----------------|
| **Cookie Consent** | User's browser (localStorage) | N/A - stays local |
| **Google Analytics** | Google servers | https://analytics.google.com |
| **PostHog** | PostHog servers (US) | https://app.posthog.com |

---

## ✅ GDPR Compliance

- ✅ Banner shows **before** any tracking
- ✅ User can accept/reject analytics
- ✅ Preferences can be changed anytime (footer button)
- ✅ Links to Privacy Policy & Terms
- ✅ Clear description of cookie usage
- ✅ Only necessary cookies without consent

---

## 🔮 Future Enhancements

Add custom event tracking in `lib/analytics.ts`:
```typescript
// Example:
posthog.capture('market_viewed', { market_id: '123' })
posthog.capture('prediction_made', { amount: 100, outcome: 'yes' })
```

Integrate with market components for detailed analytics.

---

**Last Updated:** October 12, 2025  
**Status:** Ready for production (add PostHog key)
