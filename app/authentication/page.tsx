"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import LoginForm from "@/components/LoginForm"
import SignUpForm from "@/components/SignUpForm"
import { redirect } from "next/navigation"
import { Loader2, Shield, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import { useTheme } from "next-themes"

export default function Home() {
  const [session, setSession] = useState<"login" | "signup">("login")
  const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

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
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 bg-gray-50">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grid-pattern dark:bg-grid-pattern-dark">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left side - Branding and Features */}
          <div className="lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="max-w-lg mx-auto lg:mx-0">
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center lg:text-left">
                  <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Launching Soon
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                    Elevate Your Workflow with Techonsy
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    The all-in-one platform that helps teams collaborate, automate, and deliver exceptional results.
                    Streamline your processes and focus on what matters most.
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">End-to-end encryption</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Your conversations are private and secure
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Real-time messaging</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">Instant delivery and notifications</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Team collaboration</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Organize conversations with channels and groups
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </Button>

                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Book a Demo
                  </Button>

                  <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      No credit card
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      14-day trial
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4 text-primary"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Cancel anytime
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Authentication Forms */}
          <div className="lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="w-full max-w-md">
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-6 sm:p-8">
                {/* Tab Navigation */}
                <div className="flex mb-6 sm:mb-8 bg-muted p-1 rounded-lg">
                  <button
                    className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "login"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSession("login")}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      session === "signup"
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
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
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By signing in, you agree to our{" "}
                    <button className="text-primary hover:text-primary/80 font-medium">Terms of Service</button> and{" "}
                    <button className="text-primary hover:text-primary/80 font-medium">Privacy Policy</button>
                  </p>
                </div>
              </div>

              {/* Additional CTA */}
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-sm text-muted-foreground">
                  {session === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setSession(session === "login" ? "signup" : "login")}
                    className="text-primary hover:text-primary/80 font-medium"
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
