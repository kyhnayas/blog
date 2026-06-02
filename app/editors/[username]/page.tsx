'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Eye, ArrowRight, UserPlus, UserCheck, Loader2, AlertCircle, Sparkles, BookOpen, Mail } from 'lucide-react'

export default function EditorProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  
  // Follow states
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followMutating, setFollowMutating] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadEditorProfile() {
      setLoading(true)
      try {
        // 1. Fetch current logged-in user session
        const sessionResponse = await supabase.auth.getSession()
        setCurrentUser(sessionResponse.data?.session?.user ?? null)

        // 2. Fetch editor profile details - need to use supabase directly since API doesn't have by-username endpoint
        const editorResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username.toLowerCase().trim())
          .single()

        if (editorResponse.error || !editorResponse.data) {
          throw new Error('Editor profile not found.')
        }

        const editorData = editorResponse.data
        setEditor(editorData)

        // 3. Fetch editor's published articles
        const postsResponse = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', editorData.id)
          .eq('published', true)
          .order('published_at', { ascending: false })

        if (!postsResponse.error) {
          setPosts(postsResponse.data || [])
        }

        // 4. Fetch follower count - use follow status API
        const followStatusResponse = await fetch(`/api/follow/status?editor_id=${editorData.id}`)
        const followStatusData = await followStatusResponse.json()

        if (followStatusResponse.ok) {
          setFollowerCount(followStatusData.follower_count || 0)

          // 5. If logged in, set following status
          if (sessionResponse.data?.session?.user) {
            setIsFollowing(followStatusData.is_following || false)
          }
        }

      } catch (err: any) {
        console.error('Load editor error:', err)
        setMessage({ type: 'error', text: err.message || 'Failed to load profile details.' })
      } finally {
        setLoading(false)
      }
    }

    loadEditorProfile()
  }, [supabase, username])

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push('/login?error=Please login to follow editors')
      return
    }

    if (currentUser.id === editor.id) {
      setMessage({ type: 'error', text: 'You cannot follow your own editor profile.' })
      return
    }

    setFollowMutating(true)
    setMessage(null)

    try {
      if (isFollowing) {
        // UNFOLLOW via API
        const deleteResponse = await fetch('/api/follow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editor_id: editor.id }),
        })

        const data = await deleteResponse.json()

        if (!deleteResponse.ok) {
          throw new Error(data.error || 'Failed to unfollow')
        }

        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
        setMessage({ type: 'success', text: `You unfollowed @${editor.username}` })
      } else {
        // FOLLOW via API
        const insertResponse = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editor_id: editor.id }),
        })

        const data = await insertResponse.json()

        if (!insertResponse.ok) {
          throw new Error(data.error || 'Failed to follow')
        }

        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
        setMessage({ type: 'success', text: `You are now following @${editor.username}!` })
      }
    } catch (err: any) {
      console.error('Follow error:', err)
      setMessage({ type: 'error', text: err.message || 'Follow action failed. Please try again.' })
    } finally {
      setFollowMutating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">Opening editor portfolio...</span>
        </div>
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-zinc-500 text-sm max-w-sm">The username you are trying to view does not exist on our blogging network.</p>
        <Link href="/" className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* EDITOR SUMMARY PROFILE CARD */}
        <div className="glassmorphism rounded-3xl p-8 border border-zinc-800/50 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl relative overflow-hidden">
          
          {/* Avatar Area */}
          <div className="h-28 w-28 rounded-full gradient-bg flex items-center justify-center font-bold text-4xl border-2 border-primary-500/35 shadow-lg shadow-primary-500/10 shrink-0">
            {editor.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={editor.avatar_url} alt={editor.full_name} className="h-full w-full rounded-full object-cover" />
            ) : (
              editor.full_name?.charAt(0).toUpperCase() || 'E'
            )}
          </div>

          {/* Details / Bio */}
          <div className="flex-grow space-y-4 text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{editor.full_name || 'Anonymous Editor'}</h1>
                <p className="text-sm text-primary-400 font-semibold flex items-center justify-center md:justify-start gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  @{editor.username}
                </p>
              </div>

              {/* Followers & Articles Count */}
              <div className="flex justify-center md:justify-start items-center gap-4 text-center sm:text-left bg-zinc-950/40 p-3 rounded-2xl border border-zinc-800/30">
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase">Followers</span>
                  <span className="text-base font-extrabold text-white">{followerCount}</span>
                </div>
                <div className="h-8 w-px bg-zinc-800/80"></div>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase">Articles</span>
                  <span className="text-base font-extrabold text-white">{posts.length}</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">
              {editor.bio || "This editor hasn't written a biography yet. Stay tuned for premium high-CPM contents from this writer."}
            </p>

            {/* Follow / Direct Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              {currentUser?.id !== editor.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followMutating}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing
                      ? 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20'
                  }`}
                >
                  {followMutating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Following Editor
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Follow Editor
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase px-3 py-1.5 rounded-lg bg-zinc-950/20 border border-zinc-850">
                <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                Category: High-CPM Writer
              </div>
            </div>
          </div>
        </div>

        {/* NOTIFICATION FEEDBACKS */}
        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}>
            <span className="text-xs font-medium">{message.text}</span>
          </div>
        )}

        {/* EDITOR ARTICLES GRID */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight border-b border-zinc-800/60 pb-3">
            Articles by {editor.full_name || `@${editor.username}`}
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/10 border border-zinc-850 rounded-3xl p-8 text-zinc-500 italic text-sm">
              This editor hasn't published any articles yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article 
                  key={post.id}
                  className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden flex flex-col justify-between card-hover group relative"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views} views
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                        <Link href={`/posts/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="p-6 border-t border-zinc-800/40 flex justify-end bg-zinc-950/20">
                    <Link 
                      href={`/posts/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary-400 hover:gap-1.5 transition-all"
                    >
                      Read Full Article
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
