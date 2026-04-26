import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}

export async function POST(request) {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log('Token received:', token ? 'yes' : 'NO TOKEN')

    if (!token) {
      return Response.json({ error: 'No token provided' }, { status: 401, headers: corsHeaders })
    }

    // Use anon client to verify user token
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser()

    console.log('User:', user?.email, 'Auth error:', authError?.message)

    if (authError || !user) {
      return Response.json({ error: 'Invalid token: ' + authError?.message }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { steps, title } = body

    console.log('Steps received:', steps?.length)

    if (!steps || steps.length === 0) {
      return Response.json({ error: 'No steps provided' }, { status: 400, headers: corsHeaders })
    }

    const stepsText = steps.map(s =>
      `Step ${s.stepNumber}: ${s.description} (on page: ${s.pageTitle || s.url})`
    ).join('\n')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `You are an expert business process writer. A user has recorded their browser workflow. Convert these captured steps into a clean, professional Standard Operating Procedure.

RECORDED STEPS:
${stepsText}

SOP TITLE: ${title || 'Browser Recorded Process'}

Instructions:
- Convert raw click data into professional readable steps
- Group related steps logically
- Add context and explanation
- Format as complete SOP with: Purpose, Scope, Prerequisites, Step-by-step Procedure, Notes
- Make it easy to follow for someone doing this task first time`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    console.log('AI content generated, length:', content.length)

    // Use service role for insert
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: sop, error: insertError } = await supabaseAdmin
      .from('sops')
      .insert({
        user_id: user.id,
        title: title || 'Browser Recorded SOP',
        description: `Automatically recorded from browser — ${steps.length} steps captured`,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('SOP saved:', sop?.id, 'Error:', insertError?.message)

    if (insertError) {
      return Response.json({ error: 'Failed to save: ' + insertError.message }, { status: 500, headers: corsHeaders })
    }

    return Response.json({ sopId: sop.id, title: sop.title }, { headers: corsHeaders })

  } catch (error) {
    console.error('Capture API error:', error)
    return Response.json(
      { error: 'Server error: ' + error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}