'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import dynamic from 'next/dynamic'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

import { use } from 'react'

export default function EditSop({ params }) {
  const { id } = use(params)
  const [sop, setSop] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiBox, setShowAiBox] = useState(false)

  useEffect(() => {
    fetchSop()
  }, [])

  const fetchSop = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data } = await supabase
      .from('sops')
      .select('*')
      .eq('id', id)
      .single()

    if (!data) { window.location.href = '/dashboard'; return }
    setSop(data)
    setContent(data.content || '')
    setTitle(data.title || '')
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    await supabase
      .from('sops')
      .update({ content, title, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const improveWithAI = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)

    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, instruction: aiPrompt })
      })
      const data = await response.json()
      setContent(data.content)
      setAiPrompt('')
      setShowAiBox(false)
    } catch (e) {
      alert('Something went wrong. Try again.')
    }

    setAiLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading editor...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = `/sop/${id}`}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to view
        </button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Editor</span>
        <div className="flex gap-2 items-center">
          {saved && (
            <span className="text-xs text-green-500 font-medium">Saved!</span>
          )}
          <button
            onClick={() => setShowAiBox(!showAiBox)}
            className="px-4 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50"
          >
            AI improve
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none mb-6 placeholder-gray-300"
          placeholder="SOP title..."
        />

        {/* AI improve box */}
        {showAiBox && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
            <p className="text-sm font-medium text-indigo-800 mb-3">
              Tell AI how to improve this SOP
            </p>
            <p className="text-xs text-indigo-500 mb-3">
              Examples: "Make it simpler", "Add more detail to step 3", "Make it more formal", "Add a troubleshooting section"
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && improveWithAI()}
                placeholder="Type your instruction..."
                className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-lg text-sm outline-none focus:border-indigo-400 bg-white"
              />
              <button
                onClick={improveWithAI}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {aiLoading ? 'Improving...' : 'Improve'}
              </button>
              <button
                onClick={() => setShowAiBox(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden" data-color-mode="light">
          <MDEditor
            value={content}
            onChange={setContent}
            height={580}
            preview="live"
            hideToolbar={false}
          />
        </div>

        {/* Bottom save bar */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-gray-400">
            Changes are not auto-saved — click Save changes when done
          </p>
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

      </div>
    </main>
  )
}