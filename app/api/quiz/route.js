import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { content, title } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `You are creating a quiz to test employee understanding of this Standard Operating Procedure.

SOP TITLE: ${title}
SOP CONTENT: ${content}

Create exactly 4 multiple choice questions that test understanding of the key steps and responsibilities in this SOP.

Return ONLY a valid JSON array with no extra text, no markdown, no code blocks. Just the raw JSON array like this:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

The correct field is the index (0,1,2,3) of the correct option. Make questions specific to this SOP content.`

    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const questions = JSON.parse(text)
    return Response.json({ questions })

  } catch (error) {
    console.error('Quiz API error:', error)
    return Response.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}