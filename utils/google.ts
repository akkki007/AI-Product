import { supabase } from './supabase'

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
  scope: string
  expiry_date?: string
}

export interface GoogleUserTokens {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  token_type: string
  scope: string
  expiry_date?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
}

/**
 * Get Google tokens for the current user
 */
export async function getUserGoogleTokens(userId: string): Promise<GoogleUserTokens | null> {
  try {
    const { data, error } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching Google tokens:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserGoogleTokens:', error)
    return null
  }
}

/**
 * Check if Google tokens are expired
 */
export function isTokenExpired(tokens: GoogleUserTokens): boolean {
  if (!tokens.expiry_date) return false
  
  const expiryTime = new Date(tokens.expiry_date).getTime()
  const currentTime = Date.now()
  const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
  
  return currentTime >= (expiryTime - bufferTime)
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(userId: string): Promise<GoogleUserTokens | null> {
  try {
    const tokens = await getUserGoogleTokens(userId)
    
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const newTokens = await response.json()

    // Update tokens in database
    const updatedTokens = {
      ...tokens,
      access_token: newTokens.access_token,
      expiry_date: newTokens.expires_in 
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : tokens.expiry_date,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('user_google_tokens')
      .update(updatedTokens)
      .eq('user_id', userId)

    if (error) {
      throw new Error('Failed to update tokens in database')
    }

    return updatedTokens
  } catch (error) {
    console.error('Error refreshing Google token:', error)
    return null
  }
}

/**
 * Get valid Google access token (refresh if needed)
 */
export async function getValidGoogleToken(userId: string): Promise<string | null> {
  try {
    let tokens = await getUserGoogleTokens(userId)
    
    if (!tokens) {
      return null
    }

    if (isTokenExpired(tokens)) {
      tokens = await refreshGoogleToken(userId)
      if (!tokens) {
        return null
      }
    }

    return tokens.access_token
  } catch (error) {
    console.error('Error getting valid Google token:', error)
    return null
  }
}

/**
 * Check if user has Google Calendar access
 */
export async function hasCalendarAccess(userId: string): Promise<boolean> {
  try {
    const tokens = await getUserGoogleTokens(userId)
    return tokens?.scope?.includes('https://www.googleapis.com/auth/calendar') ?? false
  } catch (error) {
    console.error('Error checking calendar access:', error)
    return false
  }
}

/**
 * Revoke Google tokens
 */
export async function revokeGoogleTokens(userId: string): Promise<boolean> {
  try {
    const tokens = await getUserGoogleTokens(userId)
    
    if (!tokens) {
      return true // No tokens to revoke
    }

    // Revoke token with Google
    if (tokens.access_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
        method: 'POST',
      })
    }

    // Delete from database
    const { error } = await supabase
      .from('user_google_tokens')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting Google tokens:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error revoking Google tokens:', error)
    return false
  }
}