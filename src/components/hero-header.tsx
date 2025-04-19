import React from 'react'
import Link from 'next/link'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { IconBrandCodesandbox } from '@tabler/icons-react'

export function HeroHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <IconBrandCodesandbox className="h-7 w-7 text-primary" stroke={1.5} />
            <span className="text-3xl font-light tracking-tight">OmniA</span>
          </Link>
        </div>
        <div className="flex items-center gap-x-1 md:gap-x-3">
          <nav className="hidden items-center space-x-1 md:flex lg:space-x-2">
            <Button variant="ghost" asChild size="sm">
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
          <div className="hidden items-center md:flex">
            <ThemeToggle />
          </div>
          <Button
            asChild
            variant="default"
            size="sm"
            className="hidden md:flex">
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>

  )
}