'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { templates, categories } from '../../lib/templates'

export default function Templates() {
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('All')
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const filtered = category === 'All'
    ? templates
    : templates.filter(t => t.category === category)

  const useTemplate = async (template) => {
    setSelected(template)
  }

  const generate = async () => {
    if (!selected) return
    setGenerating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          description: selected.prompt
        })
      })
      const data = await response.json()

      const { data: sop } = await supabase.from('sops').insert({
        user_id: user.id,
        title: selected.title,
        description: selected.description,
        content: data.content,
        created_at: new Date().toISOString()
      }).select().single()

      if (sop) {
        window.location.href = `/sop/${sop.id}`
      }
    } catch (e) {
      alert('Something went wrong. Try again.')
    }

    setGenerating(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to dashboard
        </button>
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">SOP Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a template and AI will generate a complete SOP instantly
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {filtered.map(template => (
            <div
              key={template.id}
              onClick={() => setSelected(template)}
              className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:border-indigo-300 ${
                selected?.id === template.id
                  ? 'border-indigo-500 ring-2 ring-indigo-100'
                  : 'border-gray-100'
              }`}
            >
              <div className="text-2xl mb-3">{template.icon}</div>
              <div className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-2">
                {template.category}
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">{template.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
            </div>
          ))}
        </div>

        {/* Selected template action */}
        {selected && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selected.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{selected.title}</p>
                  <p className="text-sm text-gray-500">{selected.description}</p>
                </div>
              </div>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 ml-6 whitespace-nowrap"
            >
              {generating ? 'AI is writing...' : 'Generate this SOP'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}