import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  const { question, sops } = await request.json()

  if (!sops || sops.length === 0) {
    return Response.json({ answer: 'No SOPs found. Please create some SOPs first.' })
  }

  const sopContext = sops.map(sop =>
    `SOP TITLE: ${sop.title}\n${sop.content}`
  ).join('\n\n---\n\n')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a helpful AI assistant for a company. You have access to the company's Standard Operating Procedures (SOPs). Answer the employee's question based ONLY on the SOPs provided below.

Rules:
- Answer only from the SOP content provided. Do not use outside knowledge.
- If the answer is in the SOPs, give a clear, specific, step by step answer.
- If the answer is NOT in any SOP, say: "I could not find information about this in your SOPs. You may want to create an SOP for this process."
- Always mention which SOP the answer came from at the end.
- Be friendly, clear and concise.
- Use numbered steps when explaining a process.

COMPANY SOPs:
${sopContext}

EMPLOYEE QUESTION:
${question}

ANSWER:`

  const result = await model.generateContent(prompt)
  const answer = result.response.text()

  return Response.json({ answer })
}