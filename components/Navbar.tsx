"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'
import { Menu, X, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "./theme-switcher"
import { useUser } from "@clerk/nextjs"

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const navLinks = [
    { href: "/order", label: "Place Order" },
    { href: "/track", label: "Track Order" },
    { href: "/contact", label: "Contact Us" },
  ]

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className='container mx-auto px-4 md:px-6'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          <Link href='/' className='flex-shrink-0'>
            <Logo size='sm' />
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-1'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className='ml-2'>
              <ThemeSwitcher />
            </div>

            {isLoaded && user ? (
              <Link
                href='/dashboard'
                className='ml-2 flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors'
              >
                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground'>
                  {getInitials(
                    user.fullName || user.emailAddresses[0]?.emailAddress || "U"
                  )}
                </div>
                <span className='text-sm font-medium text-foreground hidden lg:block'>
                  {user.firstName ||
                    user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
                    "User"}
                </span>
              </Link>
            ) : (
              <Link
                href='/dashboard'
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all ml-2",
                  pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                Account
              </Link>
            )}
          </div>

          {/* Mobile: User bubble + Menu */}
          <div className='flex md:hidden items-center gap-2'>
            <ThemeSwitcher />

            {isLoaded && user && (
              <Link
                href='/dashboard'
                className='w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground'
              >
                {getInitials(
                  user.fullName || user.emailAddresses[0]?.emailAddress || "U"
                )}
              </Link>
            )}

            <button
              className='p-2 rounded-lg hover:bg-muted transition-colors'
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className='md:hidden py-4 border-t border-border bg-background animate-fade-in'>
            <div className='flex flex-col gap-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 rounded-xl transition-colors font-medium",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href='/dashboard'
                className={cn(
                  "px-4 py-3 rounded-xl transition-colors font-medium",
                  pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>

              <div className="px-4 py-2">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
