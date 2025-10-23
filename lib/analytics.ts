// lib/analytics.ts
// Analytics initialization utilities

type ConsentState = {
  necessary: boolean
  behavioral: boolean
  analytics: boolean
  timestamp: number
}

// Detect if ad blocker is preventing analytics
async function detectAdBlocker(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    // Try to fetch PostHog decide endpoint via reverse proxy
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5s timeout
    
    await fetch('/ingest/decide', { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    })
    
    clearTimeout(timeoutId)
    return false // Not blocked
  } catch (error) {
    console.log('🛡️ Ad blocker or privacy tool detected - analytics disabled')
    return true // Blocked
  }
}

// Initialize Google Analytics
export function initGoogleAnalytics(measurementId: string) {
  if (typeof window === 'undefined') return
  
  // Add GA script
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script1)
  
  // Add GA config
  const script2 = document.createElement('script')
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      page_path: window.location.pathname,
    });
  `
  document.head.appendChild(script2)
  
  console.log('📊 Google Analytics initialized:', measurementId)
}

// Initialize PostHog
export async function initPostHog(apiKey: string, host: string) {
  if (typeof window === 'undefined') return
  
  const posthog = await import('posthog-js')
  
  posthog.default.init(apiKey, {
    api_host: host,
    ui_host: 'https://us.posthog.com', // Keep UI on PostHog domain
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    // Optimize for performance
    autocapture: false, // Reduce unnecessary events
    disable_session_recording: true, // Reduce blocked requests
    persistence: 'localStorage+cookie',
    // Reduce retry spam in console
    loaded: (ph) => {
      console.log('📊 PostHog loaded successfully via reverse proxy')
    },
  })
  
  console.log('📊 PostHog initialized:', apiKey)
  return posthog.default
}

// Check if user has consented to analytics
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) return false
  
  try {
    const parsed: ConsentState = JSON.parse(consent)
    return parsed.behavioral === true || parsed.analytics === true
  } catch {
    return false
  }
}

// Initialize all analytics based on consent
export async function initAnalyticsIfConsented() {
  if (!hasAnalyticsConsent()) {
    console.log('⚠️ Analytics NOT consented - skipping initialization')
    return
  }
  
  // Check for ad blocker before initializing
  const isBlocked = await detectAdBlocker()
  if (isBlocked) {
    console.log('⚠️ Analytics blocked by privacy tools - respecting user privacy')
    return
  }
  
  const consent = localStorage.getItem('cookie-consent')
  if (!consent) return
  
  try {
    const parsed: ConsentState = JSON.parse(consent)
    console.log('✅ Analytics consented - initializing...', parsed)
    
    // Google Analytics - only if analytics accepted
    if (parsed.analytics) {
      const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      if (GA_MEASUREMENT_ID) {
        initGoogleAnalytics(GA_MEASUREMENT_ID)
      } else {
        console.warn('⚠️ GA_MEASUREMENT_ID not configured')
      }
    }
    
    // PostHog - only if behavioral accepted
    if (parsed.behavioral) {
      const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
      // Use reverse proxy endpoint instead of direct PostHog URL
      const POSTHOG_HOST = '/ingest'
      
      if (POSTHOG_KEY) {
        await initPostHog(POSTHOG_KEY, POSTHOG_HOST)
      } else {
        console.warn('⚠️ POSTHOG_KEY not configured')
      }
    }
  } catch (e) {
    console.error('Failed to parse consent:', e)
  }
}
