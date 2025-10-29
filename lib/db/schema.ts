import { pgTable, text, timestamp, uuid, boolean, numeric, index, integer, varchar, unique } from 'drizzle-orm/pg-core'

// User profiles table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username').unique(),
  customAvatar: text('custom_avatar'), // URL to uploaded image in Vercel Blob
  twitterHandle: text('twitter_handle'),
  email: text('email'),
  emailVerified: boolean('email_verified').default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast wallet address lookups
  walletAddressIdx: index('wallet_address_idx').on(table.walletAddress),
  // Index for username lookups
  usernameIdx: index('username_idx').on(table.username),
}))

// Email verification tokens table
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast token lookups
  tokenIdx: index('token_idx').on(table.token),
  // Index for user verification lookups
  userIdIdx: index('email_verification_user_id_idx').on(table.userId),
}))

// User trading stats table (for caching/performance)
export const userStats = pgTable('user_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalVolume: numeric('total_volume', { precision: 20, scale: 2 }).default('0'),
  marketsTraded: numeric('markets_traded').default('0'),
  lastTradeAt: timestamp('last_trade_at'),
  activeDays: numeric('active_days').default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast user stats lookups
  userIdIdx: index('user_stats_user_id_idx').on(table.userId),
  // Index for sorting by volume (leaderboards)
  totalVolumeIdx: index('total_volume_idx').on(table.totalVolume),
  // Index for recent activity sorting
  lastTradeIdx: index('last_trade_idx').on(table.lastTradeAt),
}))

// Comments table for market discussions
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  marketId: text('market_id').notNull(), // market slug
  userAddress: text('user_address').notNull(),
  content: text('content').notNull(), // max 300 chars (enforced in API)
  gifUrl: text('gif_url'), // Tenor GIF URL (optional)
  parentId: uuid('parent_id'), // null = top-level comment, uuid = reply to comment
  votes: integer('votes').default(0).notNull(), // upvotes - downvotes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fetching comments by market
  marketIdIdx: index('comments_market_id_idx').on(table.marketId),
  // Index for fetching replies to a comment
  parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
  // Index for sorting by votes
  votesIdx: index('comments_votes_idx').on(table.votes),
  // Index for sorting by date
  createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
}))

// Comment votes table - tracks who upvoted which comments
export const commentVotes = pgTable('comment_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  commentId: uuid('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userAddress: varchar('user_address', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique constraint - user can only vote once per comment
  commentUserUnique: unique('comment_votes_comment_id_user_address_unique').on(table.commentId, table.userAddress),
  // Index for fetching votes by comment
  commentIdIdx: index('comment_votes_comment_id_idx').on(table.commentId),
  // Index for fetching votes by user
  userAddressIdx: index('comment_votes_user_address_idx').on(table.userAddress),
}))

// Market proposals table
export const marketProposals = pgTable('market_proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(), // The question
  category: text('category').notNull(), // Sports, Economy, Politics, Crypto, Culture
  endDate: timestamp('end_date').notNull(), // Estimated market end date
  source: text('source'), // Optional URL for resolution
  outcomes: text('outcomes').notNull(), // JSON array: ["Yes", "No"] or custom
  createdBy: text('created_by').notNull(), // Wallet address
  upvotes: integer('upvotes').default(0).notNull(),
  status: text('status').default('pending').notNull(), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('proposals_category_idx').on(table.category),
  statusIdx: index('proposals_status_idx').on(table.status),
  upvotesIdx: index('proposals_upvotes_idx').on(table.upvotes),
  createdAtIdx: index('proposals_created_at_idx').on(table.createdAt),
}))

// Proposal votes table
export const proposalVotes = pgTable('proposal_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: uuid('proposal_id').notNull().references(() => marketProposals.id, { onDelete: 'cascade' }),
  voterAddress: text('voter_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // User can only vote once per proposal
  proposalVoterUnique: unique('proposal_votes_unique').on(table.proposalId, table.voterAddress),
  proposalIdIdx: index('proposal_votes_proposal_id_idx').on(table.proposalId),
  voterAddressIdx: index('proposal_votes_voter_address_idx').on(table.voterAddress),
}))

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userAddress: varchar('user_address', { length: 42 }).notNull(), // Recipient (lowercase)
  type: varchar('type', { length: 20 }).notNull(), // 'comment_reply' | 'market_resolved'
  
  // Display content
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').notNull(),
  
  // Reference data
  marketSlug: varchar('market_slug', { length: 255 }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  fromUserAddress: varchar('from_user_address', { length: 42 }),
  
  // State
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
}, (table) => ({
  // Index for fetching user's notifications
  userAddressIdx: index('notifications_user_address_idx').on(table.userAddress),
  // Index for unread notifications
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  // Index for sorting by date
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  // Composite index for efficient unread queries
  userUnreadIdx: index('notifications_user_unread_idx').on(table.userAddress, table.isRead),
}))

