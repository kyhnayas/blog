'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Eye, ArrowLeft, Heart, UserPlus, UserCheck, Loader2, Sparkles, Share2, MessageCircle, Send } from 'lucide-react'
import AdComponent from '@/components/AdComponent'

interface PostClientProps {
  post: any
  author: any
  initialFollowers: number
}

export default function PostClient({ post, author, initialFollowers }: PostClientProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(initialFollowers)
  const [followMutating, setFollowMutating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [views, setViews] = useState(post.views)

  const supabase = createClient()

  useEffect(() => {
    async function initUserAndIncrementViews() {
      // 1. Get current logged-in user
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user ?? null)

      // 2. Increment views securely on mount
      try {
        await supabase.rpc('increment_post_views', { post_id: post.id })
        setViews((prev: number) => prev + 1)
      } catch (err) {
        console.error('Failed to increment post views:', err)
      }

      // 3. Check if following author
      if (session?.user) {
        const { data: followRecord } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', session.user.id)
          .eq('editor_id', author.id)
          .maybeSingle()

        if (followRecord) {
          setIsFollowing(true)
        }
      }
    }

    initUserAndIncrementViews()
  }, [supabase, post.id, author.id])

  const handleFollowToggle = async () => {
    if (!currentUser) {
      window.location.href = `/login?error=Please login to follow editors`
      return
    }

    if (currentUser.id === author.id) {
      setMessage({ type: 'error', text: 'You cannot follow yourself.' })
      return
    }

    setFollowMutating(true)
    setMessage(null)

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('editor_id', author.id)

        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
        setMessage({ type: 'success', text: `Unfollowed @${author.username}` })
      } else {
        await supabase
          .from('follows')
          .insert([{
            follower_id: currentUser.id,
            editor_id: author.id
          }])

        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
        setMessage({ type: 'success', text: `You are now following @${author.username}!` })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Action failed. Please try again.' })
    } finally {
      setFollowMutating(false)
    }
  }

  // Splitting paragraphs to inject mid-article ads
  const paragraphs = post.content.split('\n')
  const halfLength = Math.ceil(paragraphs.length / 2)
  const firstHalfContent = paragraphs.slice(0, halfLength).join('\n')
  const secondHalfContent = paragraphs.slice(halfLength).join('\n')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans py-10 transition-colors duration-300">
      
      {/* 1. ADMIN PREMIUM GLOBAL PLACEMENT: TOP HEADER BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <AdComponent 
          publisherId="pub-9571936573859682"
          slotId="4829105739"
          placeholderText="Premium Sponsor Slot • Global Header Banner"
          label="Kayhanayas.com Advertisement"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Homepage
        </Link>

        {/* 3-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: FLOATING SHARE BAR */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 sticky top-24 self-start">
            <button 
              onClick={handleFollowToggle}
              className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                isFollowing 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
              }`}
              title={isFollowing ? 'Following author' : 'Follow author'}
            >
              <Heart className={`h-5 w-5 ${isFollowing ? 'fill-current' : ''}`} />
            </button>
            <div className="h-px w-6 bg-zinc-200 dark:bg-zinc-800 mx-auto my-3"></div>
            
            <a 
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://kayhanayas.com') + '/posts/' + post.slug)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/20 transition-all"
              title="Share on X (Twitter)"
            >
              <Share2 className="h-4.5 w-4.5" />
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://kayhanayas.com') + '/posts/' + post.slug)}`}
              target="_blank"
              className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-[#1877F2] hover:border-[#1877F2]/20 transition-all"
              title="Share on Facebook"
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://kayhanayas.com') + '/posts/' + post.slug)}`}
              target="_blank"
              className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-[#0A66C2] hover:border-[#0A66C2]/20 transition-all"
              title="Share on LinkedIn"
            >
              <Send className="h-4.5 w-4.5" />
            </a>
          </div>

          {/* CENTER: MAIN CONTENT BODY */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-zinc-900 dark:text-white">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Published: {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {views} views
                </span>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>

            {/* Typography core */}
            <div className="prose dark:prose-invert prose-zinc max-w-none leading-relaxed font-serif text-base sm:text-lg">
              
              {/* First Half */}
              {firstHalfContent.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-extrabold mt-6 mb-3 font-sans">{line.replace('# ', '')}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-3 font-sans">{line.replace('## ', '')}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2 font-sans">{line.replace('### ', '')}</h3>
                if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary-500 pl-4 italic text-zinc-500 my-4 font-sans">{line.replace('> ', '')}</blockquote>
                return <p key={i} className="my-4 text-zinc-800 dark:text-zinc-300 leading-relaxed min-h-[1rem]">{line}</p>
              })}

              {/* 2. EDITOR MID-ARTICLE AD */}
              <div className="my-8 select-none font-sans">
                <AdComponent 
                  publisherId={author.adsense_pub_id}
                  slotId={author.adsense_slot_id}
                  placeholderText={`Author Sponsor Slot • Inside Post Content (${author.full_name})`}
                  label="Author Content Advertisement"
                />
              </div>

              {/* Second Half */}
              {secondHalfContent.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-extrabold mt-6 mb-3 font-sans">{line.replace('# ', '')}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-3 font-sans">{line.replace('## ', '')}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2 font-sans">{line.replace('### ', '')}</h3>
                if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary-500 pl-4 italic text-zinc-500 my-4 font-sans">{line.replace('> ', '')}</blockquote>
                return <p key={i} className="my-4 text-zinc-800 dark:text-zinc-300 leading-relaxed min-h-[1rem]">{line}</p>
              })}

            </div>

            {/* 3. EDITOR BOTTOM AD */}
            <div className="pt-6 select-none">
              <AdComponent 
                publisherId={author.adsense_pub_id}
                slotId={author.adsense_slot_id}
                placeholderText={`Author Sponsor Slot • Post Bottom Placement (${author.full_name})`}
                label="Author End Advertisement"
              />
            </div>

            {/* Author card bio */}
            <div className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-900/20 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center font-bold text-xl border border-primary-500/20 text-white shrink-0">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar_url} alt={author.full_name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  author.full_name?.charAt(0).toUpperCase() || 'E'
                )}
              </div>
              <div className="space-y-3 text-center sm:text-left flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-950 dark:text-white">Written by {author.full_name}</h4>
                    <span className="text-xs text-primary-500 font-semibold">@{author.username}</span>
                  </div>
                  {currentUser?.id !== author.id && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followMutating}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFollowing 
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' 
                          : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                      }`}
                    >
                      {followMutating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
                  {author.bio || 'This editor covers high-CPM contents and technical stories. Follow them to stay updated on future releases.'}
                </p>
                {message && <p className="text-[10px] text-zinc-400 font-semibold">{message.text}</p>}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Author summary mini card */}
            <div className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 bg-white dark:bg-zinc-900/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center font-bold text-xs border border-primary-500/20 text-white shrink-0">
                  {author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.avatar_url} alt={author.full_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    author.full_name?.charAt(0).toUpperCase() || 'E'
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">{author.full_name}</span>
                  <Link href={`/editors/${author.username}`} className="text-[10px] text-primary-500 hover:underline font-semibold">
                    View Portfolio
                  </Link>
                </div>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3">{author.bio}</p>
              
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/40 flex justify-between text-center">
                <div className="flex-1">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase">Followers</span>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{followerCount}</span>
                </div>
                <div className="w-px bg-zinc-200 dark:bg-zinc-800/80"></div>
                <div className="flex-1">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase">Author Role</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Editor</span>
                </div>
              </div>
            </div>

            {/* 4. ADMIN STICKY SIDEBAR BANNER */}
            <div className="sticky top-24 space-y-4 select-none">
              <AdComponent 
                publisherId="pub-9571936573859682"
                slotId="6281057492"
                placeholderText="Sponsor Showcase • Global Sticky Sidebar"
                label="Partner Spotlight"
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
