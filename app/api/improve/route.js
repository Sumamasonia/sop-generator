import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  const { content, instruction } = await request.json()

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `You are an expert business process writer. You have been given an existing SOP document and an instruction to improve it.

EXISTING SOP:
${content}

INSTRUCTION FROM USER:
${instruction}

Rewrite the SOP following the instruction exactly. Keep all the good parts, only change what the instruction asks for. Return only the improved SOP content, no extra commentary.`

  const result = await model.generateContent(prompt)
  const improved = result.response.text()

  return Response.json({ content: improved })
}