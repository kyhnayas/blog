'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, BookOpen, Eye, Edit3, Trash2, Loader2, AlertCircle, FileText, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function EditorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadEditorData() {
      try {
        // 1. Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          router.push('/login?error=Please login to view dashboard')
          return
        }

        // 2. Fetch profile to check if role is editor or admin
        const { data: prof, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError || !prof) {
          setMessage({ 
            type: 'error', 
            text: 'Profile details not found in the database. Please visit Settings first to ensure your profile is initialized.' 
          })
          setTimeout(() => {
            router.push('/settings')
          }, 3000)
          return
        }

        if (prof.role !== 'editor' && prof.role !== 'admin') {
          router.push('/settings?message=Become an Editor to access the publishing dashboard')
          return
        }

        setProfile(prof)

        // 3. Fetch editor's posts
        const { data: editorPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', session.user.id)
          .order('created_at', { ascending: false })

        if (postsError) {
          setMessage({ type: 'error', text: 'Failed to load your articles.' })
        } else {
          setPosts(editorPosts || [])
        }
      } catch (err: any) {
        console.error('Dashboard loading error:', err)
        setMessage({ type: 'error', text: err.message || 'Database connection timeout.' })
      } finally {
        setLoading(false)
      }
    }

    loadEditorData()
  }, [supabase, router])

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    setDeletingId(postId)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(p => p.id !== postId))
      setMessage({ type: 'success', text: 'Article deleted successfully.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete article.' })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">Loading your publishing studio...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header and Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Writers Studio</h1>
            <p className="text-sm text-zinc-400">Welcome back, {profile?.full_name}. Create draft articles, publish stories, and analyze your views.</p>
          </div>

          {(profile?.role === 'editor' || profile?.role === 'admin') && (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Write New Story
            </Link>
          )}
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

        {/* POSTS LISTING AREA */}
        {posts.length === 0 ? (
          <div className="glassmorphism rounded-3xl border border-zinc-800/50 p-12 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold">Write your first premium story</h3>
              <p className="text-zinc-400 text-sm">You haven't written any articles yet. Create high-CPM content targeting US/Canada readers to start earning ad revenue shares.</p>
            </div>
            {(profile?.role === 'editor' || profile?.role === 'admin') && (
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors"
              >
                Start draft now
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex flex-col justify-between card-hover relative overflow-hidden group"
              >
                {/* Image and Tag Headers */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      post.published 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{post.views} views</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {post.summary || 'No summary provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-zinc-800/40 pt-4 mt-6">
                  <span className="text-[10px] font-medium text-zinc-500">
                    Created: {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {post.published && (
                      <Link
                        href={`/posts/${post.slug}`}
                        target="_blank"
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="View Article"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/edit/${post.id}`}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingId === post.id}
                      className="p-2 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/10 hover:border-rose-500/30 rounded-xl text-rose-400 transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
