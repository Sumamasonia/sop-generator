import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  const { title, description } = await request.json()

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `You are an expert business process writer. Create a detailed, professional Standard Operating Procedure (SOP) document.

Title: ${title}
Process description: ${description}

Write a complete SOP with these sections:
1. Purpose
2. Scope  
3. Responsibilities
4. Step-by-step procedure (numbered steps, very clear and detailed)
5. Notes and tips

Format it cleanly with clear headings. Be specific and practical. Write as if training a new employee.`

  const result = await model.generateContent(prompt)
  const content = result.response.text()

  return Response.json({ content })
}