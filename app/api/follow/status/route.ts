import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/follow/status?editor_id=xxx - Check if user is following editor
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

    const { searchParams } = new URL(req.url)
    const editor_id = searchParams.get('editor_id')

    if (!editor_id) {
      return NextResponse.json(
        { error: 'editor_id query parameter is required' },
        { status: 400 }
      )
    }

    // Check follow status
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', session.user.id)
      .eq('editor_id', editor_id)
      .maybeSingle()

    if (error) {
      console.error('Follow status check error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Fetch follower count for editor
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('editor_id', editor_id)

    return NextResponse.json({
      success: true,
      is_following: !!data,
      follower_count: count || 0,
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}
