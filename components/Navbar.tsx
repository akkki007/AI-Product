"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <span className="font-bold">T</span>
            </div>
            <span className="font-bold text-xl hidden md:inline-block">Techonsy</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Link href="/authentication" className="hidden md:inline-block">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              Log in
            </Button>
            </Link>
            <Button size="sm">Get Started</Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
