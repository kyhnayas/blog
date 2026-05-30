'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Eye, ArrowRight, Search, Clock, TrendingUp, Loader2, Sparkles } from 'lucide-react'

export default function ArticleArchive() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadAllPosts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('published', true)
        .order(sortBy === 'latest' ? 'published_at' : 'views', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
      setLoading(false)
    }

    loadAllPosts()
  }, [supabase, sortBy])

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative ambient glowing background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Breadcrumb */}
        <div className="space-y-2 border-b border-zinc-800/60 pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Article Archive</h1>
          <p className="text-sm text-zinc-400">Explore the entire collection of published writings, technical insights, and revenue strategies.</p>
        </div>

        {/* Search & Sort Panel */}
        <div className="glassmorphism rounded-3xl p-6 border border-zinc-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, author..."
              className="block w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-850 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm shadow-inner"
            />
          </div>

          <div className="flex p-0.5 bg-zinc-900/60 rounded-xl border border-zinc-800/30 self-start sm:self-auto">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                sortBy === 'latest' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                sortBy === 'popular' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Popular
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
            <span className="text-zinc-500 text-sm">Browsing library archive...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-zinc-500 text-base italic">No archived articles found matching your criteria.</p>
            <Link 
              href="/"
              className="text-primary-400 font-semibold text-sm hover:underline"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          /* Archive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article 
                key={post.id}
                className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden flex flex-col justify-between card-hover group relative"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-video overflow-hidden bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>

                  {/* Body Details */}
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

                    <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                      <Link href={`/posts/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                </div>

                {/* Author footer */}
                <div className="p-6 border-t border-zinc-800/40 flex items-center justify-between bg-zinc-950/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center font-bold text-xs border border-primary-500/20 text-white shrink-0">
                      {post.author?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.author.avatar_url} alt={post.author.full_name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        post.author?.full_name?.charAt(0).toUpperCase() || 'E'
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-zinc-200 block">{post.author?.full_name}</span>
                      <span className="text-[10px] text-zinc-500 block">@{post.author?.username || 'writer'}</span>
                    </div>
                  </div>

                  <Link 
                    href={`/posts/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-400 hover:gap-1.5 transition-all"
                  >
                    Read Story
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
