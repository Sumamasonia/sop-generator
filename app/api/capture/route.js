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
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { steps, title } = await request.json()

    if (!steps || steps.length === 0) {
      return Response.json({ error: 'No steps provided' }, { status: 400 })
    }

    const stepsText = steps.map(s =>
      `Step ${s.stepNumber}: ${s.description} (on page: ${s.pageTitle || s.url})`
    ).join('\n')

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `You are an expert business process writer. A user has recorded their browser workflow and you have the captured steps. Convert these into a clean, professional Standard Operating Procedure.

RECORDED STEPS:
${stepsText}

SOP TITLE: ${title || 'Browser Recorded Process'}

Instructions:
- Clean up the raw click data into professional, human-readable steps
- Group related steps together logically
- Add context and explanation where needed
- Include screenshots placeholder notes like "[Screenshot: shows X]" where helpful
- Format as a complete SOP with: Purpose, Scope, Prerequisites, Step-by-step Procedure, Notes

Make it professional and easy to follow for someone doing this task for the first time.`

    const result = await model.generateContent(prompt)
    const content = result.response.text()

    const { data: sop, error } = await supabase.from('sops').insert({
      user_id: user.id,
      title: title || 'Browser Recorded SOP',
      description: `Automatically recorded from browser — ${steps.length} steps captured`,
      content,
      created_at: new Date().toISOString()
    }).select().single()

    if (error) {
      return Response.json({ error: 'Failed to save SOP' }, { status: 500 })
    }

    return Response.json({ sopId: sop.id, title: sop.title }, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
})

  } catch (error) {
    console.error('Capture API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}