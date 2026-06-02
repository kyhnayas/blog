import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/views - Increment post view count
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

    const body = await req.json()
    const { post_id } = body

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      )
    }

    // Fetch current view count
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', post_id)
      .single()

    if (fetchError || !post) {
      console.error('Post fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment view count by 1
    const { error } = await supabase
      .from('posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', post_id)

    if (error) {
      console.error('View increment error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      new_view_count: (post.views || 0) + 1,
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}
