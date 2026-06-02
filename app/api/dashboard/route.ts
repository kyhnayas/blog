import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dashboard - Fetch dashboard data (profile + posts + follower count)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    )

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user is editor or admin
    if (profile.role !== 'editor' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only editors can access dashboard' },
        { status: 403 }
      )
    }

    // 2. Fetch user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Posts fetch error:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 400 }
      )
    }

    // 3. Fetch follower count
    const { count: followerCount, error: countError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('editor_id', session.user.id)

    if (countError) {
      console.error('Follower count error:', countError)
    }

    return NextResponse.json({
      success: true,
      profile,
      posts: posts || [],
      follower_count: followerCount || 0,
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}
