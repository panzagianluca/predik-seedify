'use client'

import { useState, useEffect } from 'react'
import { X, Cookie, Settings } from 'lucide-react'
import { initAnalyticsIfConsented } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'

type ConsentState = {
  necessary: boolean
  behavioral: boolean
  analytics: boolean
  timestamp: number
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [behavioralEnabled, setBehavioralEnabled] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    } else {
      // Load existing preference and initialize analytics if consented
      try {
        const parsed = JSON.parse(consent) as ConsentState
        setBehavioralEnabled(parsed.behavioral || false)
        setAnalyticsEnabled(parsed.analytics || false)
        
        // Initialize analytics if user previously consented
        if (parsed.behavioral || parsed.analytics) {
          initAnalyticsIfConsented()
        }
      } catch (e) {
        // Invalid consent, show banner
        setShowBanner(true)
      }
    }

    // Listen for open preferences event
    const handleOpenPreferences = () => {
      // Load current consent state when opening preferences
      const consent = localStorage.getItem('cookie-consent')
      if (consent) {
        try {
          const parsed = JSON.parse(consent) as ConsentState
          setBehavioralEnabled(parsed.behavioral || false)
          setAnalyticsEnabled(parsed.analytics || false)
        } catch (e) {
          setBehavioralEnabled(false)
          setAnalyticsEnabled(false)
        }
      }
      setShowPreferences(true)
    }
    window.addEventListener('open-cookie-preferences', handleOpenPreferences)
    return () => window.removeEventListener('open-cookie-preferences', handleOpenPreferences)
  }, [])

  const saveConsent = async (necessary: boolean, behavioral: boolean, analytics: boolean) => {
    const consent: ConsentState = {
      necessary,
      behavioral,
      analytics,
      timestamp: Date.now(),
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setBehavioralEnabled(behavioral)
    setAnalyticsEnabled(analytics)
    setShowBanner(false)
    setShowPreferences(false)
    
    // Initialize analytics if accepted
    if (behavioral || analytics) {
      console.log('✅ Analytics cookies ENABLED - consent saved:', consent)
      await initAnalyticsIfConsented()
    } else {
      console.log('⚠️ Analytics cookies DISABLED - consent saved:', consent)
    }
  }

  const acceptAll = () => {
    console.log('🟢 ACEPTAR TODO clicked - enabling ALL cookies')
    haptics.success()
    saveConsent(true, true, true)
  }

  const acceptNecessary = () => {
    console.log('🟡 SOLO NECESARIAS clicked - disabling analytics')
    haptics.medium()
    saveConsent(true, false, false)
  }

  if (!showBanner && !showPreferences) return null

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showPreferences && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 md:w-full md:max-w-sm">
          <div className="bg-card border border-border rounded-lg shadow-2xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-2 mb-3">
              <Cookie className="w-5 h-5 text-electric-purple shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[14px] mb-1.5">Usamos cookies</h3>
                <p className="text-[14px] text-muted-foreground leading-snug">
                  Cookies necesarias para el sitio y analíticas para mejorar tu experiencia.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={acceptAll}
                className="flex-1 h-9 bg-electric-purple hover:bg-electric-purple/90 text-white font-medium text-[14px] rounded-md transition-all duration-200"
              >
                Aceptar todo
              </button>
              <button
                onClick={acceptNecessary}
                className="flex-1 h-9 bg-muted hover:bg-muted/80 text-foreground font-medium text-[14px] rounded-md transition-all duration-200"
              >
                Solo necesarias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreferences(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold">Preferencias de Cookies</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Necessary Cookies */}
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[14px]">Cookies Necesarias</h4>
                  <div className="px-2 py-1 bg-muted rounded text-[12px] font-medium">
                    Siempre activas
                  </div>
                </div>
                <p className="text-[14px] text-muted-foreground mb-2">
                  Esenciales para el funcionamiento del sitio.
                </p>
                <div className="bg-muted/50 rounded p-2 text-[12px]">
                  <div className="grid grid-cols-4 gap-2 font-semibold mb-1 text-muted-foreground">
                    <div>Nombre</div>
                    <div>Dominio</div>
                    <div>Uso</div>
                    <div>Duración</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="font-mono">cc_cookie</div>
                    <div className="text-muted-foreground truncate">predik.io</div>
                    <div className="text-muted-foreground">Preferencias</div>
                    <div className="text-muted-foreground">6 meses</div>
                  </div>
                </div>
              </div>

              {/* Behavioral Cookies (PostHog) */}
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[14px]">Cookies de Comportamiento</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="behavioral-toggle"
                      className="sr-only peer"
                      checked={behavioralEnabled}
                      onChange={(e) => setBehavioralEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-electric-purple/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-purple"></div>
                  </label>
                </div>
                <p className="text-[14px] text-muted-foreground mb-2">
                  Nos ayudan a entender cómo usas el sitio y mejorar la experiencia.
                </p>
                <div className="bg-muted/50 rounded p-2 text-[12px]">
                  <div className="grid grid-cols-4 gap-2 font-semibold mb-1 text-muted-foreground">
                    <div>Nombre</div>
                    <div>Servicio</div>
                    <div>Uso</div>
                    <div>Duración</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="font-mono">ph_*</div>
                    <div className="text-muted-foreground truncate">PostHog</div>
                    <div className="text-muted-foreground">Comportamiento</div>
                    <div className="text-muted-foreground">1 año</div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies (Google Analytics) */}
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-[14px]">Cookies de Analytics</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="analytics-toggle"
                      className="sr-only peer"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-electric-purple/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-purple"></div>
                  </label>
                </div>
                <p className="text-[14px] text-muted-foreground mb-2">
                  Nos permiten medir el tráfico y analizar el rendimiento del sitio.
                </p>
                <div className="bg-muted/50 rounded p-2 text-[12px]">
                  <div className="grid grid-cols-4 gap-2 font-semibold mb-1 text-muted-foreground">
                    <div>Nombre</div>
                    <div>Servicio</div>
                    <div>Uso</div>
                    <div>Duración</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="font-mono">_ga</div>
                    <div className="text-muted-foreground truncate">Google Analytics</div>
                    <div className="text-muted-foreground">Analytics</div>
                    <div className="text-muted-foreground">2 años</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2">
              <button
                onClick={() => {
                  console.log('💾 GUARDAR clicked - saving current toggle state:', { behavioral: behavioralEnabled, analytics: analyticsEnabled })
                  saveConsent(true, behavioralEnabled, analyticsEnabled)
                }}
                className="flex-1 h-9 bg-electric-purple hover:bg-electric-purple/90 text-white font-medium text-[14px] rounded-md transition-all duration-200"
              >
                Guardar mis preferencias
              </button>
              <button
                onClick={() => {
                  console.log('🟢 ACEPTAR TODO clicked from modal - enabling all toggles and saving')
                  setBehavioralEnabled(true)
                  setAnalyticsEnabled(true)
                  saveConsent(true, true, true)
                }}
                className="flex-1 h-9 bg-muted hover:bg-muted/80 text-foreground font-medium text-[14px] rounded-md transition-all duration-200"
              >
                Aceptar todo
              </button>
              <button
                onClick={() => {
                  console.log('🟡 SOLO NECESARIAS clicked from modal - disabling all analytics')
                  setBehavioralEnabled(false)
                  setAnalyticsEnabled(false)
                  saveConsent(true, false, false)
                }}
                className="flex-1 h-9 border border-border hover:bg-muted text-foreground font-medium text-[14px] rounded-md transition-all duration-200"
              >
                Solo necesarias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
