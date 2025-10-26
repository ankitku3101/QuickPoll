'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl font-semibold">
                QuickPoll.
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">

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
                  avatarBox: "size-10"
                }
              }}
            />
              </div>
            ) : (
              <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-all tracking-tight">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all tracking-tight">
                Sign Up
              </button>
            </SignUpButton>
              </div>
            )}
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border bg-muted/50 hover:bg-muted transition-all cursor-pointer"
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