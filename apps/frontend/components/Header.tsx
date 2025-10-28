'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import GuestLoginButton from './GuestLoginButton';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex h-16 items-center justify-between flex-wrap gap-2 md:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">QuickPoll.</h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Auth Section */}
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-muted-foreground font-medium tracking-tight">
                  {user?.firstName || user?.username}
                </span>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'size-10',
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <GuestLoginButton className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm" />

                <SignInButton mode="modal">
                  <button className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-all tracking-tight cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all tracking-tight cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>

            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center rounded-full border border-border bg-muted/50 hover:bg-muted transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
