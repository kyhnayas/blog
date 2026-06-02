import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/admin/users/[id] - Update user role (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if user is admin
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update user roles' },
        { status: 403 }
      )
    }

    // Cannot change own role
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own admin role' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { role } = body

    if (!role || !['reader', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "reader", "editor", or "admin"' },
        { status: 400 }
      )
    }

    // Update user role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (error) {
      console.error('Role update error:', error)
      return NextResponse.json(
        { error: error.message },
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
