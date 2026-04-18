'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

import { use } from 'react'

export default function SopPage({ params }) {
  const { id } = use(params)
  const [sop, setSop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const contentRef = useRef(null)

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
    setLoading(false)

    if (data && user) {
  markAsRead(data.id, user.id)
}
  }

  const markAsRead = async (sopId, userId) => {
  const { data: assignments } = await supabase
    .from('assignments')
    .select('employee_id')
    .eq('sop_id', sopId)
    .eq('user_id', userId)

  if (assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      await supabase.from('sop_reads').upsert({
        sop_id: sopId,
        employee_id: assignment.employee_id,
        user_id: userId,
        read_at: new Date().toISOString()
      }, { onConflict: 'sop_id,employee_id' })
    }
  }
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

const downloadPDF = async () => {
  setPdfLoading(true)
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = margin

    const addText = (text, fontSize, isBold, color) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach(line => {
        if (y + 8 > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += fontSize * 0.45
      })
    }

    // Header bar
    doc.setFillColor(79, 70, 229)
    doc.rect(0, 0, pageWidth, 28, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('SOPly', margin, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Standard Operating Procedure', pageWidth - margin, 18, { align: 'right' })
    y = 42

    // Title
    addText(sop.title, 20, true, [17, 24, 39])
    y += 4

    // Meta info
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Created: ${new Date(sop.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, y)
    doc.text('Status: Active', margin + 80, y)
    y += 10

    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Content
    const lines = sop.content.split('\n')
    lines.forEach(line => {
      if (!line.trim()) { y += 4; return }

      if (line.startsWith('# ') || line.match(/^\d+\.\s+[A-Z][^a-z]/)) {
        y += 4
        addText(line.replace(/^#+\s*/, ''), 13, true, [17, 24, 39])
        y += 2
      } else if (line.startsWith('## ')) {
        y += 3
        addText(line.replace(/^#+\s*/, ''), 11, true, [55, 65, 81])
        y += 1
      } else if (line.match(/^\*\*(.+)\*\*$/)) {
        addText(line.replace(/\*\*/g, ''), 10, true, [17, 24, 39])
      } else if (line.match(/^\d+\./)) {
        const num = line.match(/^\d+\./)[0]
        const text = line.replace(/^\d+\.\s*/, '')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(99, 102, 241)
        doc.text(num, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const wrapped = doc.splitTextToSize(text, maxWidth - 10)
        wrapped.forEach(l => {
          if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin }
          doc.text(l, margin + 10, y)
          y += 5.5
        })
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        const text = line.replace(/^[-•]\s*/, '')
        doc.setFontSize(10)
        doc.setTextColor(99, 102, 241)
        doc.text('•', margin + 2, y)
        doc.setTextColor(55, 65, 81)
        doc.setFont('helvetica', 'normal')
        const wrapped = doc.splitTextToSize(text, maxWidth - 8)
        wrapped.forEach(l => {
          if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin }
          doc.text(l, margin + 8, y)
          y += 5.5
        })
      } else {
        addText(line, 10, false, [55, 65, 81])
        y += 1
      }
    })

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFillColor(249, 250, 251)
      doc.rect(0, pageHeight - 14, pageWidth, 14, 'F')
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.setFont('helvetica', 'normal')
      doc.text('Generated by SOPly — soply.vercel.app', margin, pageHeight - 6)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
    }

    doc.save(`${sop.title}.pdf`)
  } catch (e) {
    alert('PDF generation failed. Try again.')
  }
  setPdfLoading(false)
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
            onClick={() => window.location.href = `/sop/${id}/edit`}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
          Edit
          </button>
          <button
  onClick={() => window.location.href = `/sop/${id}/versions`}
  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
>
  History
</button>

<button
  onClick={() => window.location.href = `/sop/${id}/reads`}
  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
>
  Read receipts
</button>

<button
  onClick={() => window.location.href = `/sop/${id}/quiz`}
  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
>
  Quiz
</button>

          <button
            onClick={downloadTxt}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
          Download .txt
        </button>
        <button
          onClick={downloadPDF}
          disabled={pdfLoading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
       {pdfLoading ? 'Generating...' : 'Download PDF'}
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