/**
 * Haptic feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

// Check if haptics are enabled in user preferences
function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const preference = localStorage.getItem('haptics-enabled')
  // Default to enabled if not set
  return preference !== 'false'
}

// Check if device supports vibration API
function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

/**
 * Haptic feedback patterns
 */
export const haptics = {
  /**
   * Light tap - for subtle interactions (buttons, cards)
   * Duration: 10ms
   */
  light: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate(10)
  },

  /**
   * Medium tap - for important actions (trades, confirmations)
   * Duration: 20ms
   */
  medium: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate(20)
  },

  /**
   * Success pattern - for successful operations
   * Pattern: short-pause-short (10ms, 50ms pause, 10ms)
   */
  success: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate([10, 50, 10])
  },

  /**
   * Error pattern - for failed operations
   * Pattern: buzz-buzz-buzz (20ms, 100ms pause, 20ms, 100ms pause, 20ms)
   */
  error: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate([20, 100, 20, 100, 20])
  },

  /**
   * Warning pattern - for warnings or important notices
   * Pattern: long-short (30ms, 80ms pause, 10ms)
   */
  warning: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate([30, 80, 10])
  },

  /**
   * Selection pattern - for selecting items (filters, tabs)
   * Duration: 5ms - very subtle
   */
  selection: () => {
    if (!isHapticsEnabled() || !supportsVibration()) return
    navigator.vibrate(5)
  },
}

/**
 * Toggle haptics on/off in user preferences
 */
export function toggleHaptics(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem('haptics-enabled', enabled.toString())
}

/**
 * Get current haptics preference
 */
export function getHapticsEnabled(): boolean {
  return isHapticsEnabled()
}
