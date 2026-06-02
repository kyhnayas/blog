import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/follow - Follow editor
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

    const body = await req.json()
    const { editor_id } = body

    if (!editor_id) {
      return NextResponse.json(
        { error: 'editor_id is required' },
        { status: 400 }
      )
    }

    // Cannot follow yourself
    if (editor_id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    // Create follow record
    const { error } = await supabase
      .from('follows')
      .insert([
        {
          follower_id: session.user.id,
          editor_id,
        },
      ])

    if (error) {
      console.error('Follow error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to follow' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}

// DELETE /api/follow - Unfollow editor
export async function DELETE(req: NextRequest) {
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

    const body = await req.json()
    const { editor_id } = body

    if (!editor_id) {
      return NextResponse.json(
        { error: 'editor_id is required' },
        { status: 400 }
      )
    }

    // Delete follow record
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', session.user.id)
      .eq('editor_id', editor_id)

    if (error) {
      console.error('Unfollow error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to unfollow' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}
