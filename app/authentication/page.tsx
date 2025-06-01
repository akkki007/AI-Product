"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import LoginForm from "@/components/LoginForm"
import SignUpForm from "@/components/SignUpForm"
import { redirect } from "next/navigation"
import { Loader2, Shield, Users, Zap } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function Home() {
  const [session, setSession] = useState<"login" | "signup">("login")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (user) {
          redirect("/chat")
        }
        if (error) {
          console.error("Error fetching user:", error)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        redirect("/chat")
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left side - Branding and Features */}
          <div className="lg:w-1/2 flex flex-col justify-center px-8 py-12">
            <div className="max-w-lg">
              <div className="space-y-6 -mt-36">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Connect with your team</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Secure, fast, and reliable messaging for modern teams. Join thousands of users already collaborating
                    seamlessly.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mt-1">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">End-to-end encryption</h3>
                      <p className="text-gray-600 dark:text-gray-300">Your conversations are private and secure</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mt-1">
                      <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Real-time messaging</h3>
                      <p className="text-gray-600 dark:text-gray-300">Instant delivery and notifications</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mt-1">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Team collaboration</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Organize conversations with channels and groups
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">+5</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Join 10,000+ users</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Already using ChatApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Authentication Forms */}
          <div className="lg:w-1/2 flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-md">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-xl p-8">
                {/* Tab Navigation */}
                <div className="flex mb-8 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "login"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    onClick={() => setSession("login")}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "signup"
                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    onClick={() => setSession("signup")}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form Content */}
                <div className="transition-all duration-300 ease-in-out">
                  {session === "login" ? <LoginForm /> : <SignUpForm />}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    By signing in, you agree to our{" "}
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">
                      Privacy Policy
                    </button>
                  </p>
                </div>
              </div>

              {/* Additional CTA */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {session === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setSession(session === "login" ? "signup" : "login")}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                  >
                    {session === "login" ? "Sign up for free" : "Sign in instead"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
