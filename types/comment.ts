// Comment type for market discussions
export interface Comment {
  id: string
  marketId: string
  userAddress: string
  content: string
  gifUrl?: string | null
  parentId?: string | null
  votes: number
  createdAt: string
  updatedAt: string
  
  // Client-side computed fields
  username?: string
  avatarUrl?: string
  replies?: Comment[]
  hasVoted?: boolean // Whether current user has upvoted this comment
}

// API request/response types
export interface CreateCommentRequest {
  marketId: string
  userAddress: string
  content: string
  gifUrl?: string
  parentId?: string
}

// Removed VoteCommentRequest - upvote is now a toggle (no direction needed)
