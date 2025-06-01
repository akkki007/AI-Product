/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { AuthError } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, Loader2, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type?: string; content?: string }>({
    type: '',
    content: '',
  })

  const router = useRouter()

  const passwordRequirements = [
    { test: (pwd: string) => pwd.length >= 6, text: "At least 6 characters" },
    { test: (pwd: string) => /[A-Z]/.test(pwd), text: "One uppercase letter" },
    { test: (pwd: string) => /[a-z]/.test(pwd), text: "One lowercase letter" },
    { test: (pwd: string) => /\d/.test(pwd), text: "One number" },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session && !error) {
          console.log('Existing session found, redirecting to chat')
          router.push("/chat")
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    
    checkExistingSession()
  }, [router])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session) {
          // Create user profile for OAuth signups
          if (session.user.app_metadata?.provider === 'google') {
            await createUserProfile(session.user)
          }
          
          setMessage({
            type: "success",
            content: "Successfully authenticated! Redirecting...",
          })
          
          // Small delay to show success message
          setTimeout(() => {
            router.push("/chat")
          }, 1000)
        }

      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      setMessage({
        type: 'error',
        content: 'Please meet all password requirements.',
      })
      return
    }

    if (!passwordsMatch) {
      setMessage({
        type: 'error',
        content: 'Passwords do not match.',
      })
      return
    }

    setLoading(true)
    setMessage({})
    
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0],
            full_name: email.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      if (user && !user.email_confirmed_at) {
        // User needs to confirm email
        setMessage({
          type: 'success',
          content: 'Account created! Please check your email to confirm your account before signing in.',
        })
      } else if (user && user.email_confirmed_at) {
        // User is immediately confirmed (this happens in development sometimes)
        await createUserProfile(user)
        
        setMessage({
          type: 'success',
          content: 'Account created successfully! Redirecting...',
        })
        
        setTimeout(() => {
          router.push("/chat")
        }, 1000)
      }

    } catch (error: unknown) {
      console.error('Signup error:', error)
      
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof AuthError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setMessage({ 
        type: 'error', 
        content: errorMessage 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setMessage({})

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Add calendar scopes
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent' // Ensures we get a refresh token
          }
        }
      })

      if (error) throw error

      // OAuth redirect will handle the rest - don't set loading to false here
      console.log('OAuth redirect initiated')

    } catch (error: unknown) {
      console.error("Google signup error:", error)
      setMessage({
        type: "error",
        content: error instanceof Error ? error.message : "Failed to sign up with Google."
      })
      setGoogleLoading(false)
    }
  }

  const createUserProfile = async (user: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating profile:', error)
        // Don't throw error - profile creation failure shouldn't block authentication
      } else {
        console.log('User profile created successfully')
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign up to get started with your account
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11 text-black dark:text-white dark:bg-gray-800"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 pr-10 h-11 text-black dark:text-white dark:bg-gray-800"
              placeholder="Create a password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
          
          {password && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Password requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {req.test(password) ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${req.test(password) ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`pl-10 pr-10 h-11 text-black dark:text-white dark:bg-gray-800 ${
                confirmPassword && !passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-600 dark:text-red-500 flex items-center space-x-1">
              <X className="h-3 w-3" />
              <span>Passwords do not match</span>
            </p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="text-xs text-green-600 dark:text-green-500 flex items-center space-x-1">
              <Check className="h-3 w-3" />
              <span>Passwords match</span>
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            I agree to the{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={loading || !isPasswordValid || !passwordsMatch} 
          className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading || googleLoading}
          variant="outline"
          className="w-full h-11 border-gray-300 hover:text-black hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white"
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {googleLoading ? 'Connecting to Google...' : 'Sign up with Google Calendar'}
        </Button>

        {message.content && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.content}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}