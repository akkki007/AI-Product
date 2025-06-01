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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left side - Branding and Features */}
          <div className="lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="max-w-lg mx-auto lg:mx-0">
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    Connect with your team
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Secure, fast, and reliable messaging for modern teams. Join thousands of users already collaborating
                    seamlessly.
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">End-to-end encryption</h3>
                      <p className="text-gray-600 text-sm sm:text-base">Your conversations are private and secure</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Real-time messaging</h3>
                      <p className="text-gray-600 text-sm sm:text-base">Instant delivery and notifications</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Team collaboration</h3>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Organize conversations with channels and groups
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex -space-x-1 sm:-space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">+5</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">Join 10,000+ users</p>
                      <p className="text-xs sm:text-sm text-gray-600">Already using ChatApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Authentication Forms */}
          <div className="lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
                {/* Tab Navigation */}
                <div className="flex mb-6 sm:mb-8 bg-gray-100 p-1 rounded-lg">
                  <button
                    className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "login" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setSession("login")}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "signup" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
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
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    By signing in, you agree to our{" "}
                    <button className="text-blue-600 hover:text-blue-500 font-medium">Terms of Service</button> and{" "}
                    <button className="text-blue-600 hover:text-blue-500 font-medium">Privacy Policy</button>
                  </p>
                </div>
              </div>

              {/* Additional CTA */}
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-sm text-gray-600">
                  {session === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setSession(session === "login" ? "signup" : "login")}
                    className="text-blue-600 hover:text-blue-500 font-medium"
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
