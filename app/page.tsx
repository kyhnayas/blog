'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sparkles, ArrowRight, BookOpen, DollarSign, ShieldAlert, Award, Calendar, Eye, Search, TrendingUp, Clock } from 'lucide-react'
import Newsletter from '@/components/Newsletter'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchPublishedPosts() {
      setLoading(true)
      // Fetch published posts and join profiles to get author details
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles (
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('published', true)
        .order(sortBy === 'latest' ? 'published_at' : 'views', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
      setLoading(false)
    }

    fetchPublishedPosts()
  }, [supabase, sortBy])

  // Filter posts based on search input
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stylish Mock Posts to show as beautiful placeholders if database is empty
  const mockPosts = [
    {
      id: 'mock-1',
      title: 'Maximizing AdSense RPM: The Ultimate Guide for North American Publishers',
      slug: 'maximizing-adsense-rpm-north-america',
      summary: 'Learn the secret pricing floor configurations, content strategies, and user layouts that yield 4x higher CPM rates in the USA and Canada.',
      image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60',
      views: 1420,
      published_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      author: {
        full_name: 'Kayhan Ayas',
        username: 'kayhan',
        avatar_url: ''
      }
    },
    {
      id: 'mock-2',
      title: 'Building a Premium Brand in High-CPM Niches Without Social Media',
      slug: 'premium-brands-high-cpm-niches',
      summary: 'Explore how targeted search engine optimization (SEO) outperforms viral social content for revenue sustainability and user loyalty.',
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
      views: 950,
      published_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
      author: {
        full_name: 'Writers Network',
        username: 'editor_hub',
        avatar_url: ''
      }
    },
    {
      id: 'mock-3',
      title: 'Why Micro-Animations and Clean Typography Directly Impact Ad Viewability',
      slug: 'typography-impact-ad-viewability',
      summary: 'AdSense earnings rely heavily on active viewability metrics. Let’s look at how premium typography keeps users scrolling longer.',
      image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
      views: 780,
      published_at: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
      author: {
        full_name: 'Design Lead',
        username: 'ux_creator',
        avatar_url: ''
      }
    }
  ]

  const displayPosts = posts.length > 0 ? filteredPosts : mockPosts

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] rounded-full bg-gradient-to-b from-primary-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 space-y-24 sm:space-y-32">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100/50 dark:bg-primary-950/30 border border-primary-200/40 dark:border-primary-800/40 text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Multi-User Blogging Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
            Write High-CPM Content,<br />
            <span className="gradient-text font-black">Share the Revenue.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The next-generation publishing space targeting USA & Canada readers. Write premium articles, plug in your own Google AdSense, and keep 100% of your article's ad revenue.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white gradient-bg rounded-2xl shadow-xl shadow-primary-500/20 hover:shadow-primary-500/35 transition-all duration-300 group cursor-pointer"
            >
              Start Writing Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#stories"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-800/50 rounded-2xl shadow-md transition-all duration-300 cursor-pointer"
            >
              Read Stories
            </a>
          </div>
        </div>

        {/* ARTICLES EXPLORER SECTION */}
        <div id="stories" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/60 pb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Featured Stories</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Explore high-quality contents from our editors, optimized for modern readers.</p>
            </div>

            {/* Sorting Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full sm:w-48 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs"
                />
              </div>

              {/* Date / View Sorting Toggles */}
              <div className="flex p-0.5 bg-zinc-200/50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    sortBy === 'latest' 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    sortBy === 'popular' 
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Popular
                </button>
              </div>
            </div>
          </div>

          {/* Seed Notice */}
          {posts.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-3xl">
              💡 **No published articles found in the database yet.** Below are beautiful pre-seeded premium mock articles so you can explore the layout while setting up your database! Once you publish articles inside your dashboard, they will automatically appear here.
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPosts.map((post) => (
              <article 
                key={post.id}
                className="bg-white dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/50 rounded-3xl overflow-hidden flex flex-col justify-between card-hover group relative"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
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

                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                      <Link href={`/posts/${post.slug}`} className="focus:outline-none">
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                </div>

                {/* Author footer */}
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20">
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
                      <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">{post.author?.full_name}</span>
                      <span className="text-[10px] text-zinc-500 block">@{post.author?.username || 'writer'}</span>
                    </div>
                  </div>

                  <Link 
                    href={`/posts/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:gap-1.5 transition-all"
                  >
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </article>
            ))}
          </div>
        </div>

        {/* REVENUE DISTRIBUTION HIGHLIGHT */}
        <div className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 p-8 sm:p-12 bg-white dark:bg-zinc-900/20 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-primary-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Monetization Policy
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                How Ads Are Distributed
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                We believe in fair compensation for writers while maintaining the platform infrastructure. Our ad revenue share engine separates ads by ownership:
              </p>
              
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <span className="text-zinc-700 dark:text-zinc-300 text-sm"><strong className="text-zinc-900 dark:text-white">Admin Ad Placements:</strong> Global Header Banners and Global Sticky Sidebar Banners belong to the platform owner.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✓</div>
                  <span className="text-zinc-700 dark:text-zinc-300 text-sm"><strong className="text-zinc-900 dark:text-white">Editor Ad Placements:</strong> In-article content banners and post bottom banners belong 100% to the post's author (Google AdSense IDs).</span>
                </li>
              </ul>
            </div>

            {/* Visual breakdown box */}
            <div className="border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-950/60 space-y-4">
              <div className="text-center py-2 px-4 bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold rounded-lg uppercase tracking-wider">
                Admin Global Banner Ad Slot (Header)
              </div>
              <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 bg-white dark:bg-zinc-900/60 space-y-3 shadow-inner">
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-6 w-2/3 bg-zinc-300 dark:bg-zinc-700 rounded font-bold text-center flex items-center justify-center text-[10px] uppercase text-zinc-600 dark:text-zinc-400 tracking-wide">Article Title</div>
                <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg text-center uppercase tracking-wider">
                  Editor Ad Slot (Inside Article Content)
                </div>
                <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg text-center uppercase tracking-wider">
                  Editor Ad Slot (Bottom of Article)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEWSLETTER ENTRANCE */}
        <div>
          <Newsletter />
        </div>

      </div>
    </div>
  )
}
