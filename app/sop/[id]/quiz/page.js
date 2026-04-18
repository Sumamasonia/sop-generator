'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function QuizPage({ params }) {
  const { id } = use(params)
  const [sop, setSop] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingQuiz, setExistingQuiz] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)

    const [{ data: sopData }, { data: quizData }] = await Promise.all([
      supabase.from('sops').select('*').eq('id', id).single(),
      supabase.from('quizzes').select('*').eq('sop_id', id).eq('user_id', user.id).single()
    ])

    setSop(sopData)
    if (quizData) {
      setExistingQuiz(quizData)
      setQuestions(quizData.questions || [])
    }
    setLoading(false)
  }

  const generateQuiz = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sop.content, title: sop.title })
      })
      const data = await response.json()

      if (data.questions) {
        setQuestions(data.questions)
        const { data: saved } = await supabase.from('quizzes').upsert({
          sop_id: id,
          user_id: user.id,
          questions: data.questions,
          created_at: new Date().toISOString()
        }, { onConflict: 'sop_id,user_id' }).select().single()
        setExistingQuiz(saved)
      }
    } catch (e) {
      alert('Failed to generate quiz. Try again.')
    }
    setGenerating(false)
  }

  const selectAnswer = (questionIndex, optionIndex) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const submitQuiz = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.')
      return
    }

    setSaving(true)
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++
    })

    const finalScore = Math.round((correct / questions.length) * 100)
    const passed = finalScore >= 70
    setScore(finalScore)
    setSubmitted(true)

    if (existingQuiz) {
      await supabase.from('quiz_attempts').insert({
        quiz_id: existingQuiz.id,
        sop_id: id,
        user_id: user.id,
        answers,
        score: finalScore,
        passed,
        attempted_at: new Date().toISOString()
      })
    }

    setSaving(false)
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading quiz...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = `/sop/${id}`}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to SOP
        </button>
        <span className="text-lg font-semibold text-gray-900">Knowledge Quiz</span>
        <button
          onClick={generateQuiz}
          disabled={generating}
          className="px-4 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
        >
          {generating ? 'Generating...' : existingQuiz ? 'Regenerate quiz' : 'Generate quiz'}
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{sop?.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Test your understanding of this SOP</p>
        </div>

        {/* Result screen */}
        {submitted && (
          <div className={`rounded-2xl p-8 mb-6 text-center ${
            score >= 70 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
          }`}>
            <div className="text-5xl mb-3">{score >= 70 ? '🎉' : '📚'}</div>
            <p className={`text-4xl font-bold mb-2 ${score >= 70 ? 'text-green-700' : 'text-red-700'}`}>
              {score}%
            </p>
            <p className={`font-medium mb-1 ${score >= 70 ? 'text-green-800' : 'text-red-800'}`}>
              {score >= 70 ? 'Passed! Great understanding of this SOP.' : 'Not passed. Please re-read the SOP and try again.'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {questions.filter((q, i) => answers[i] === q.correct).length} out of {questions.length} correct · Pass mark is 70%
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-white"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = `/sop/${id}`}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Back to SOP
              </button>
            </div>
          </div>
        )}

        {/* No quiz yet */}
        {questions.length === 0 && !generating && (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <div className="text-4xl mb-3">🧠</div>
            <p className="font-medium text-gray-800 mb-1">No quiz yet</p>
            <p className="text-sm text-gray-500 mb-6">Generate an AI quiz to test employee understanding of this SOP</p>
            <button
              onClick={generateQuiz}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Generate quiz with AI
            </button>
          </div>
        )}

        {generating && (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <div className="text-4xl mb-3 animate-pulse">🧠</div>
            <p className="text-gray-500 text-sm">AI is generating quiz questions...</p>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="flex flex-col gap-4">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white border border-gray-100 rounded-2xl p-6">
                <p className="font-medium text-gray-900 mb-4 text-sm leading-relaxed">
                  <span className="text-indigo-500 font-semibold mr-2">Q{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {q.options.map((option, oi) => {
                    const isSelected = answers[qi] === oi
                    const isCorrect = q.correct === oi
                    const isWrong = submitted && isSelected && !isCorrect

                    return (
                      <button
                        key={oi}
                        onClick={() => selectAnswer(qi, oi)}
                        className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          submitted
                            ? isCorrect
                              ? 'border-green-300 bg-green-50 text-green-800'
                              : isWrong
                              ? 'border-red-300 bg-red-50 text-red-800'
                              : 'border-gray-100 text-gray-500'
                            : isSelected
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                            : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {['A', 'B', 'C', 'D'][oi]}.
                        </span>
                        {option}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">Explanation: </span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <button
                onClick={submitQuiz}
                disabled={saving || Object.keys(answers).length < questions.length}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 mt-2"
              >
                {saving ? 'Submitting...' : `Submit quiz (${Object.keys(answers).length}/${questions.length} answered)`}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}