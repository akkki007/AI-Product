import { PersonStanding } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Frame } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'

const Navbar = () => {
  return (
    <div>
        <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Frame className="h-6 w-6" />
            <Link href="/" className="text-xl font-bold">
              Nexus
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium">
                Pages
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link href="/about">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/features">Features</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/pricing">Pricing</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/blog" className="text-sm font-medium">
              Blog
            </Link>
            <Link href="/contact" className="text-sm font-medium">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/authentication" className="hidden md:flex">
            <Button className="hidden md:flex">
              <PersonStanding className="mr-2 h-4 w-4" />
              Start
            </Button>
            </Link>
          </div>
        </div>
      </header>
    </div>
  )
}

export default Navbar