// app/auth/callback/page.tsx (CLIENT COMPONENT)
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { Loader2 } from 'lucide-react'

interface GoogleTokens {
  provider_token: string;
  provider_refresh_token: string | null;
  expires_in: number | null;
}

export default function CallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        const provider_token = hashParams.get('provider_token')
        const provider_refresh_token = hashParams.get('provider_refresh_token')
        const expires_in = hashParams.get('expires_in')
        const error = hashParams.get('error')
        const error_description = hashParams.get('error_description')

        // Check for errors first
        if (error) {
          console.error('OAuth error:', error, error_description)
          setStatus('error')
          setMessage(`Authentication failed: ${error_description || error}`)
          setTimeout(() => router.push('/authentication'), 3000)
          return
        }

        if (!access_token) {
          console.error('No access token found')
          setStatus('error')
          setMessage('No access token received')
          setTimeout(() => router.push('/authentication'), 3000)
          return
        }

        console.log('Setting session with tokens...')
        
        // Set the session with Supabase
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || ''
        })

        if (sessionError) {
          console.error('Error setting session:', sessionError)
          setStatus('error')
          setMessage('Failed to establish session')
          setTimeout(() => router.push('/authentication'), 3000)
          return
        }

        console.log('Session established successfully')
        
        // Store Google tokens if available
        if (provider_token && data.user) {
          console.log(data.user.id);
          
          try {
            await storeGoogleTokens(data.user.id, {
              provider_token: provider_token || '', // Ensure string (fallback empty string if null)
              provider_refresh_token: provider_refresh_token || null, // Explicit null
              expires_in: expires_in ? parseInt(expires_in) : null // Explicit null
            });
            console.log('Google tokens stored successfully')
          } catch (tokenError) {
            console.error('Error storing Google tokens:', tokenError)
            // Don't fail the whole process for this
          }
        }

        setStatus('success')
        setMessage('Authentication successful! Redirecting...')
        
        // Clean up URL and redirect
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => router.push('/chat'), 1500)

      } catch (error) {
        console.error('Callback error:', error)
        setStatus('error')
        setMessage('Unexpected error occurred')
        setTimeout(() => router.push('/authentication'), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Completing authentication...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we set up your account.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Success!
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-2 text-xs text-gray-500">Redirecting to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to store Google tokens
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function storeGoogleTokens(userId: string, tokens: GoogleTokens) {
  if (!tokens.provider_token) return;

  // Calculate expiry timestamp in milliseconds (as bigint)
  const expiryDate = tokens.expires_in 
    ? Date.now() + tokens.expires_in * 1000
    : Date.now() + 3600 * 1000; // Default 1 hour if expires_in not provided

  const tokenData = {
    user_id: userId,
    access_token: tokens.provider_token,
    refresh_token: tokens.provider_refresh_token || null,
    expiry_date: expiryDate.toString(), // Convert to string for bigint field
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Upsert operation to handle both new and existing tokens
    const { error } = await supabase
      .from('user_google_tokens')
      .upsert(tokenData)
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log('Google tokens stored/updated successfully');
  } catch (error) {
    console.error('Error storing Google tokens:', error);
    throw error;
  }
}