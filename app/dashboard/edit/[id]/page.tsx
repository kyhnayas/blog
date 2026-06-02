'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Eye, Edit3, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [published, setPublished] = useState(false)

  // Editor mode state: 'write' vs 'preview'
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadPostData() {
      try {
        // 1. Get current session
        const sessionResponse = await supabase.auth.getSession()
        if (!sessionResponse.data?.session) {
          router.push('/login?error=Please login to edit a post')
          return
        }

        setUser(sessionResponse.data.session.user)

        // 2. Fetch post via API
        const postResponse = await fetch(`/api/posts/${id}`)
        const postData = await postResponse.json()

        if (!postResponse.ok || !postData.post) {
          router.push('/dashboard?error=Article not found')
          return
        }

        const post = postData.post

        // 3. Verify authorization
        const roleResponse = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionResponse.data.session.user.id)
          .single()

        const profile = roleResponse.data

        if (post.author_id !== sessionResponse.data.session.user.id && profile?.role !== 'admin') {
          router.push('/dashboard?error=You are not authorized to edit this article')
          return
        }

        // Pre-populate fields
        setTitle(post.title || '')
        setSlug(post.slug || '')
        setSummary(post.summary || '')
        setContent(post.content || '')
        setImageUrl(post.image_url || '')
        setPublished(post.published || false)

        setLoading(false)
      } catch (err: any) {
        console.error('Load post error:', err)
        router.push(`/dashboard?error=${encodeURIComponent('Failed to load article. Please try again.')}`)
      }
    }

    loadPostData()
  }, [supabase, router, id])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    setSlug(generatedSlug)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      if (!title.trim()) throw new Error('Please enter an article title.')
      if (!slug.trim()) throw new Error('Please enter a valid URL slug.')
      if (!content.trim()) throw new Error('Please write some content for the article.')

      // Update post via API
      const updateResponse = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          summary: summary.trim(),
          content: content.trim(),
          imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60',
          published,
        }),
      })

      const data = await updateResponse.json()

      if (!updateResponse.ok) {
        if (data.error?.includes('slug')) {
          throw new Error('This URL slug is already taken by another article. Please modify the slug.')
        }
        throw new Error(data.error || 'Failed to update article')
      }

      setMessage({ type: 'success', text: 'Article updated successfully!' })
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      console.error('Save error:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update article.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-medium">Retrieving article details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div className="space-y-1">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Edit Story</h1>
            <p className="text-sm text-zinc-400">Modify your drafts or published posts, update your headers, or adjust your slugs.</p>
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

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* EDITOR BODY (LEFT 2 COLS) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glassmorphism rounded-3xl p-6 sm:p-8 border border-zinc-800/50 space-y-6">
              
              {/* Title & Slug inputs */}
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter a captivating title..."
                  className="block w-full bg-transparent border-0 border-b border-zinc-800 focus:border-primary-500 focus:ring-0 text-2xl sm:text-3xl font-extrabold text-white placeholder-zinc-650 pb-3 transition-colors duration-200"
                />

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="font-semibold select-none">Slug URL:</span>
                  <span className="text-zinc-500">/posts/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="my-first-post"
                    className="bg-transparent border-0 border-b border-dashed border-zinc-800 focus:border-primary-500 focus:ring-0 p-0 text-xs text-primary-400 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* WRITE VS PREVIEW TABS */}
              <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/30">
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className={`flex-grow py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    editorMode === 'write' 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`flex-grow py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    editorMode === 'preview' 
                      ? 'bg-zinc-800 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Live Preview
                </button>
              </div>

              {/* EDITOR WORK AREA */}
              {editorMode === 'write' ? (
                <div className="space-y-2">
                  <textarea
                    rows={18}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your premium article content in Markdown here..."
                    className="block w-full px-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm font-mono leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-zinc-500 text-right">Markdown syntax is fully supported.</p>
                </div>
              ) : (
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-6 min-h-[384px] overflow-y-auto max-h-[500px]">
                  {content ? (
                    <article className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-a:text-primary-400 prose-blockquote:border-primary-500 prose-blockquote:bg-zinc-900/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl">
                      {content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>
                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.replace('## ', '')}</h2>
                        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.replace('### ', '')}</h3>
                        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary-500 pl-4 italic text-zinc-400 my-2">{line.replace('> ', '')}</blockquote>
                        return <p key={i} className="my-1.5 text-zinc-300 leading-relaxed min-h-[1rem]">{line}</p>
                      })}
                    </article>
                  ) : (
                    <div className="text-center py-20 text-zinc-500 text-xs italic">
                      Nothing to preview yet. Start typing in the Editor tab!
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ARTICLE METADATA (RIGHT 1 COL) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glassmorphism rounded-3xl p-6 border border-zinc-800/50 space-y-6">
              
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 border-b border-zinc-800/60 pb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Metadata & Settings
              </h3>

              {/* Summary Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Short Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter a brief summary..."
                  className="block w-full px-3 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-xs resize-none"
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cover Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="block w-full px-3 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-white placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-xs"
                />
              </div>

              {/* Publishing Status Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded text-primary-600 bg-zinc-900 border-zinc-800 focus:ring-primary-500 focus:ring-offset-zinc-950 h-4.5 w-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">Publish article</span>
                    <p className="text-[10px] text-zinc-500 leading-tight">If unchecked, this post will be saved as a draft.</p>
                  </div>
                </label>
              </div>

              {/* Actions Box */}
              <div className="pt-4 border-t border-zinc-800/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
