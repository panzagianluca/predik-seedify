import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Use DATABASE_URL for compatibility, fallback to build-safe empty string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

// Only initialize if connection string exists (skip during build if not set)
const sql = connectionString ? neon(connectionString) : null

export const db = sql ? drizzle(sql, { schema }) : null as any
