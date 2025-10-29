// Hook to fetch user profile data
export async function fetchUserProfile(walletAddress: string) {
  try {
    const response = await fetch(`/api/profile/update?walletAddress=${walletAddress}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      username: data.username,
      customAvatar: data.customAvatar
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Format wallet address for display
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
