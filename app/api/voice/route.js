import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { transcript, title } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `You are an expert business process writer. A user has verbally described a business process. Convert their spoken description into a clean, professional Standard Operating Procedure document.

SPOKEN DESCRIPTION:
"${transcript}"

${title ? `SOP TITLE: ${title}` : ''}

Create a complete SOP with these sections:
1. Purpose
2. Scope
3. Responsibilities
4. Step-by-step procedure (numbered, clear, detailed)
5. Notes and tips

Clean up any verbal filler words. Make it professional and actionable. Format with clear headings.`

    const result = await model.generateContent(prompt)
    const content = result.response.text()
    return Response.json({ content, suggestedTitle: title || 'Voice Generated SOP' })

  } catch (error) {
    console.error('Voice API error:', error)
    if (error?.status === 429) {
      return Response.json({ error: 'API quota exceeded. Please wait and try again.' }, { status: 429 })
    }
    return Response.json({ error: 'Failed to process voice input.' }, { status: 500 })
  }
}