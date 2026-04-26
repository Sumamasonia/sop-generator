import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return Response.json({
      token: data.session.access_token,
      user: { email: data.user.email, id: data.user.id }
    })

  } catch (error) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}