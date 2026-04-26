import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('Auth attempt for:', email)

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log('Auth error:', error.message)
      return Response.json({ error: error.message }, { status: 401 })
    }

    if (!data.session) {
      return Response.json({ error: 'No session created' }, { status: 401 })
    }

    console.log('Auth success for:', email)

    return Response.json({
  token: data.session.access_token,
  user: { email: data.user.email, id: data.user.id }
}, {
  headers: { 'Access-Control-Allow-Origin': '*' }
})

  } catch (error) {
    console.error('Extension auth error:', error)
    return Response.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}