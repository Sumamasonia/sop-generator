'use client'
import { useState, useEffect, use} from 'react'
import { supabase } from '../../../lib/supabase'

export default function SopPage({ params }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [sop, setSop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) fetchSop()
  }, [id])

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
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sop.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    const blob = new Blob([sop.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sop.title}.txt`
    a.click()
  }

  const formatContent = (content) => {
    if (!content) return []
    return content.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-3" />

      if (line.startsWith('# ') || line.match(/^\d+\.\s+[A-Z]/)) {
        return <h2 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{line.replace(/^#+\s*/, '')}</h2>
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-medium text-gray-800 mt-4 mb-2">{line.replace(/^#+\s*/, '')}</h3>
      }
      if (line.match(/^\*\*(.+)\*\*$/)) {
        return <p key={i} className="font-semibold text-gray-900 mt-3">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.match(/^\d+\./)) {
        return (
          <div key={i} className="flex gap-3 my-1.5">
            <span className="text-indigo-500 font-medium text-sm min-w-fit">{line.match(/^\d+\./)[0]}</span>
            <p className="text-gray-700 text-sm leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</p>
          </div>
        )
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 my-1">
            <span className="text-indigo-400 mt-1.5">•</span>
            <p className="text-gray-700 text-sm leading-relaxed">{line.replace(/^[-•]\s*/, '')}</p>
          </div>
        )
      }
      return <p key={i} className="text-gray-700 text-sm leading-relaxed my-1">{line}</p>
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading your SOP...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to dashboard
        </button>
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            {copied ? 'Copied!' : 'Copy text'}
          </button>
          <button
            onClick={downloadTxt}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Download
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-block text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full mb-3">
                Standard Operating Procedure
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">{sop.title}</h1>
            </div>
          </div>

          <div className="flex gap-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {new Date(sop.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-sm text-green-600 font-medium mt-0.5">Active</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Generated by</p>
              <p className="text-sm text-gray-700 mt-0.5">AI</p>
            </div>
          </div>
        </div>

        {/* SOP content card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="prose max-w-none">
            {formatContent(sop.content)}
          </div>
        </div>

        {/* Original description */}
        {sop.description && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mt-6">
            <p className="text-xs text-indigo-500 font-medium mb-2">Original description you provided</p>
            <p className="text-sm text-indigo-800 leading-relaxed">{sop.description}</p>
          </div>
        )}

      </div>
    </main>
  )
}