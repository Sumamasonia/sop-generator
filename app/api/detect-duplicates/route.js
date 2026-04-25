import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { sops } = await request.json()

    if (!sops || sops.length < 2) {
      return Response.json({ duplicates: [] })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const sopList = sops.map((s, i) => `ID:${s.id} | TITLE: ${s.title} | PREVIEW: ${s.content?.substring(0, 200)}`).join('\n\n')

    const prompt = `You are analyzing a list of SOPs to find duplicates or highly similar ones.

SOPs:
${sopList}

Find pairs of SOPs that cover the same or very similar processes. Return ONLY a valid JSON array like this:
[
  {
    "sop1_id": "uuid-here",
    "sop2_id": "uuid-here", 
    "sop1_title": "title here",
    "sop2_title": "title here",
    "similarity": 85,
    "reason": "Both cover the same customer refund process"
  }
]

Only include pairs with similarity above 60%. If no duplicates found, return empty array []. Return ONLY raw JSON, no markdown.`

    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const duplicates = JSON.parse(text)
    return Response.json({ duplicates })

  } catch (error) {
    console.error('Duplicate detection error:', error)
    return Response.json({ duplicates: [] })
  }
}