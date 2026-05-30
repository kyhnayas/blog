'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sparkles, User, Settings, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch public profile to get role and details
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="glassmorphism sticky top-0 z-50 w-full border-b border-zinc-200/40 dark:border-zinc-800/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="gradient-bg p-1.5 rounded-lg shadow-md shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                kayhanayas<span className="gradient-text font-extrabold">.com</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">
              Home
            </Link>
            
            {/* If user is logged in and is editor/admin */}
            {profile && (profile.role === 'editor' || profile.role === 'admin') && (
              <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors">
                Write a Post
              </Link>
            )}

            {/* Auth Buttons / Dropdown */}
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium focus:outline-none cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold border border-primary-500/20 group-hover:scale-105 transition-transform">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
                    {profile?.full_name || 'My Account'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{profile?.username ? `@${profile.username}` : user.email}</p>
                      {profile?.role && (
                        <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300">
                          {profile.role}
                        </span>
                      )}
                    </div>
                    
                    {profile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                        Admin Panel
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-zinc-400" />
                      Profile Settings
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border-t border-zinc-100 dark:border-zinc-800/80 mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white gradient-bg hover:opacity-90 transition-opacity rounded-xl shadow-md shadow-primary-500/10"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200/40 dark:border-zinc-800/30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-all duration-300 py-3 px-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Home
          </Link>
          
          {profile && (profile.role === 'editor' || profile.role === 'admin') && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Write a Post
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Admin Panel
            </Link>
          )}

          {user ? (
            <>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Profile Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center px-3 py-2 rounded-lg text-base font-bold text-white gradient-bg"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
