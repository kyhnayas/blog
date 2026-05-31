'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, Sparkles, Loader2, AlertCircle, CheckCircle, Save, ArrowLeft, Heart, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ProfileSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Form states
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [adsensePubId, setAdsensePubId] = useState('')
  const [adsenseSlotId, setAdsenseSlotId] = useState('')
  const [role, setRole] = useState('reader')
  const [followerCount, setFollowerCount] = useState(0)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        // 1. Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push('/login?error=Please login to view settings')
          return
        }

        setUser(session.user)

        // 2. Fetch profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          // Display clear notice if profile doesn't exist (e.g. trigger failed or manual dashboard creation)
          setMessage({ 
            type: 'error', 
            text: 'Profile record not found in the database. If you registered without email confirmation, please try logging out and logging back in, or check if the trigger function was executed on Supabase.' 
          })
        } else if (profile) {
          setUsername(profile.username || '')
          setFullName(profile.full_name || '')
          setBio(profile.bio || '')
          setAvatarUrl(profile.avatar_url || '')
          setAdsensePubId(profile.adsense_pub_id || '')
          setAdsenseSlotId(profile.adsense_slot_id || '')
          setRole(profile.role || 'reader')
        }

        // 3. Fetch follower count
        const { count, error: countError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('editor_id', session.user.id)

        if (!countError && count !== null) {
          setFollowerCount(count)
        }
      } catch (err: any) {
        console.error('Settings load error:', err)
        setMessage({ type: 'error', text: err.message || 'Failed to establish connection to database.' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSave started', { user, username })
    if (!user) {
      console.log('No user, returning')
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long.')
      }

      console.log('About to update profiles table')
      // Refresh session first
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      if (sessionError) throw sessionError

      // Update database profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase().trim(),
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim(),
          adsense_pub_id: adsensePubId.trim(),
          adsense_slot_id: adsenseSlotId.trim(),
        })
        .eq('id', user.id)
        .select()

      console.log('Update response:', { error })
      if (error) {
        console.error('Update error:', error)
        throw error
      }

      setMessage({ type: 'success', text: 'Your profile settings have been updated successfully!' })
      router.refresh()
    } catch (err: any) {
      console.error('Save error:', err)
      setMessage({ type: 'error', text: err.message || 'An error occurred while updating settings.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">Loading profile settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
            <p className="text-sm text-zinc-400">Configure your public profile, editor biography, and Google AdSense credentials.</p>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Shield className="h-4 w-4 text-primary-500" />
              Role: <span className="font-bold text-white uppercase tracking-wider">{role}</span>
            </div>
            {role === 'editor' && (
              <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
                Followers: <span className="font-bold text-white">{followerCount}</span>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* Main Settings Panel Grid */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDEBAR: PROFILE SUMMARY */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glassmorphism rounded-3xl p-6 border border-zinc-800/50 text-center space-y-5">
              <div className="relative inline-block mx-auto">
                <div className="h-24 w-24 rounded-full gradient-bg flex items-center justify-center text-white text-3xl font-bold border border-primary-500/35 shadow-lg shadow-primary-500/10">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      className="h-full w-full rounded-full object-cover"
                      onError={() => setAvatarUrl('')} 
                    />
                  ) : (
                    fullName.charAt(0).toUpperCase() || (user ? user.email.charAt(0).toUpperCase() : 'U')
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{fullName || 'Add your name'}</h3>
                <p className="text-xs text-zinc-400">@{username || 'username'}</p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/30 text-left space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Platform Status</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {role === 'admin' 
                    ? 'Administrator privileges. Full write, delete, and system user promotion controls.' 
                    : role === 'editor' 
                    ? 'Editor role active. You can create, manage articles, and collect ad revenue.' 
                    : 'Reader role. Promote your profile to Editor in the Admin Dashboard to write and earn.'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: EDITABLE INPUTS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glassmorphism rounded-3xl p-8 border border-zinc-800/50 space-y-6">
              
              <h2 className="text-xl font-bold border-b border-zinc-800/60 pb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-500" />
                Profile Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kayhan_editor"
                    className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Kayhan Ayas"
                    className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or your custom avatar URL"
                  className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Biography (Bio)</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your readers about yourself, your background, and the kind of high-income topics you cover."
                  className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm resize-none"
                />
              </div>

              {/* REVENUE ADSENSE OPTIONS (PROTECTED FOR EDITORS & ADMINS ONLY) */}
              <div className="pt-4 border-t border-zinc-800/60">
                <h2 className="text-xl font-bold pb-3 flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                  Google AdSense Setup (Revenue Share)
                </h2>
                
                {role === 'reader' ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm leading-relaxed">
                    Google AdSense monetization is only unlocked for **Editors**. Once your account is promoted by the Administrator, you will be able to plug in your custom Publisher ID and Ad Slot ID to display your ads directly inside your articles.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      Writers on the platform keep 100% of the in-article and bottom-of-page ad units. Plug in your details below. We handle script injection and resizing automatically!
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">AdSense Publisher ID</label>
                        <input
                          type="text"
                          value={adsensePubId}
                          onChange={(e) => setAdsensePubId(e.target.value)}
                          placeholder="pub-XXXXXXXXXXXXXXXX"
                          className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                        <p className="text-[10px] text-zinc-500">Your unique Google AdSense Publisher account ID.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Ad Unit Slot ID</label>
                        <input
                          type="text"
                          value={adsenseSlotId}
                          onChange={(e) => setAdsenseSlotId(e.target.value)}
                          placeholder="XXXXXXXXXX"
                          className="block w-full px-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                        <p className="text-[10px] text-zinc-500">The specific ID representing your display banner ad unit.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SAVE SETTINGS BUTTON */}
              <div className="pt-6 border-t border-zinc-800/60 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-3.5 px-6 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <>
                      Save Changes
                      <Save className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  )
}
