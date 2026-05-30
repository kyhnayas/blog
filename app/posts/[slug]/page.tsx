import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PostClient from './PostClient'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

// 1. NEXT.JS METADATA API SETUP FOR DYNAMIC SEO TAGS & OPENGRAPH
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, summary, image_url, created_at, updated_at')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return {
      title: 'Article Not Found | kayhanayas.com',
    }
  }

  return {
    title: `${post.title} | kayhanayas.com`,
    description: post.summary || 'Premium article on kayhanayas.com',
    alternates: {
      canonical: `https://kayhanayas.com/posts/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary || '',
      url: `https://kayhanayas.com/posts/${slug}`,
      siteName: 'kayhanayas.com',
      images: [
        {
          url: post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary || '',
      images: [post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800'],
      creator: '@kayhanayas',
    },
  }
}

// 2. SERVER COMPONENT FULFILLING HIGH-SEO AND JSON-LD PARSING
export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch post details on the server for instant spider loading
  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles (
        id,
        username,
        full_name,
        avatar_url,
        bio,
        adsense_pub_id,
        adsense_slot_id
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Article Not Found</h2>
        <p className="text-zinc-500 text-sm max-w-sm">The post you are trying to read may have been draft-saved, deleted, or its URL slug is incorrect.</p>
        <Link href="/" className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">
          Go back home
        </Link>
      </div>
    )
  }

  // Get initial followers count on the server
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('editor_id', post.author.id)

  // 3. JSON-LD STRUCTURED DATA FOR GOOGLE BLOGPOSTING (USA/CANADA RANKINGS)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kayhanayas.com/posts/${slug}`,
    },
    headline: post.title,
    description: post.summary,
    image: post.image_url,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author.full_name,
      url: `https://kayhanayas.com/editors/${post.author.username}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'kayhanayas.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kayhanayas.com/favicon.ico',
      },
    },
  }

  return (
    <>
      {/* Insert JSON-LD into head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostClient 
        post={post} 
        author={post.author} 
        initialFollowers={followerCount || 0} 
      />
    </>
  )
}
