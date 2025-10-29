/**
 * Profile Picture Utility Functions
 * 
 * Handles random assignment and persistence of default profile pictures
 * based on wallet addresses using localStorage.
 */

const PROFILE_PICTURES = [
  '/profiles/avatar-1.svg',
  '/profiles/avatar-2.svg',
  '/profiles/avatar-3.svg',
  '/profiles/avatar-4.svg',
  '/profiles/avatar-5.svg',
  '/profiles/avatar-6.svg',
  '/profiles/avatar-7.svg',
  '/profiles/avatar-8.svg',
  '/profiles/avatar-9.svg',
  '/profiles/avatar-10.svg',
]

const STORAGE_KEY = 'predik_user_profiles'

/**
 * Get stored profile assignments from localStorage
 */
function getStoredProfiles(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (err) {
    console.error('Error reading profile assignments:', err)
    return {}
  }
}

/**
 * Save profile assignments to localStorage
 */
function saveProfiles(profiles: Record<string, string>): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch (err) {
    console.error('Error saving profile assignments:', err)
  }
}

/**
 * Generate a deterministic index from wallet address
 * This ensures the same wallet always gets the same avatar (unless manually changed)
 */
function getIndexFromAddress(address: string): number {
  // Simple hash function to convert address to index
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % PROFILE_PICTURES.length
}

/**
 * Get profile picture for a wallet address
 * If not assigned yet, randomly assigns one and persists it
 * 
 * @param address - Wallet address (0x...)
 * @returns Path to profile picture
 */
export function getProfilePicture(address: string | undefined): string {
  if (!address) return PROFILE_PICTURES[0] // Default fallback
  
  const normalizedAddress = address.toLowerCase()
  const profiles = getStoredProfiles()
  
  // If already assigned, return it
  if (profiles[normalizedAddress]) {
    return profiles[normalizedAddress]
  }
  
  // Otherwise, assign based on address hash for consistency
  const index = getIndexFromAddress(normalizedAddress)
  const assignedPicture = PROFILE_PICTURES[index]
  
  // Save the assignment
  profiles[normalizedAddress] = assignedPicture
  saveProfiles(profiles)
  
  return assignedPicture
}

/**
 * Change profile picture for a wallet address
 * 
 * @param address - Wallet address
 * @param pictureIndex - Index of the new profile picture (0-9)
 */
export function changeProfilePicture(address: string, pictureIndex: number): void {
  if (pictureIndex < 0 || pictureIndex >= PROFILE_PICTURES.length) {
    throw new Error(`Invalid picture index: ${pictureIndex}. Must be between 0 and ${PROFILE_PICTURES.length - 1}`)
  }
  
  const normalizedAddress = address.toLowerCase()
  const profiles = getStoredProfiles()
  profiles[normalizedAddress] = PROFILE_PICTURES[pictureIndex]
  saveProfiles(profiles)
}

/**
 * Get all available profile pictures
 */
export function getAllProfilePictures(): string[] {
  return [...PROFILE_PICTURES]
}
