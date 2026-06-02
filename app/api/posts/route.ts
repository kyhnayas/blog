import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts - Fetch user's posts
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

    // Fetch user's posts
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      posts: data || [],
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post
export async function POST(req: NextRequest) {
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

    // Check if user is editor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'editor' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only editors can create posts' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Create post
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title: body.title?.trim(),
          slug: body.slug?.toLowerCase().trim(),
          content: body.content?.trim(),
          image_url: body.imageUrl?.trim(),
          author_id: session.user.id,
          published: body.published === true,
          published_at: body.published ? new Date().toISOString() : null,
        },
      ])
      .select()

    if (error) {
      console.error('Post creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, post: data?.[0] })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}

