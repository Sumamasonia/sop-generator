'use client'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
  if (!email || !email.includes('@')) return

  try {
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
  } catch (e) {}

  setSubmitted(true)
  setEmail('')
}

  return (
    <main className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
          Sign in
        </button>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
           Get started free
        </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20">
        <div className="inline-block text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full mb-6">
          AI-powered process documentation
        </div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-5 leading-tight max-w-2xl mx-auto">
          Turn any workflow into a documented SOP in 5 minutes
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          Record your screen, describe your process, or just talk — our AI writes clean professional SOPs automatically.
        </p>

        {!submitted ? (
          <div className="flex gap-3 max-w-md mx-auto justify-center">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Join waitlist
            </button>
          </div>
        ) : (
          <div className="text-green-600 font-medium">
            You are on the list! We will email you when we launch.
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Free to join · No credit card needed
        </p>
      </section>

      {/* Stats */}
      <section className="flex justify-center gap-6 px-6 pb-16">
       {[
  { number: '5 min', label: 'avg time to create SOP' },
  { number: '10+ hrs', label: 'saved per employee/month' },
  { number: '0%', label: 'knowledge lost on exit' },
].map(s => (
  <div
    key={s.label}
    onClick={() => window.location.href = '/login'}
    className="text-center bg-gray-50 rounded-xl px-8 py-5 cursor-pointer hover:bg-indigo-50 transition-colors"
  >
            <div className="text-2xl font-semibold text-gray-900">{s.number}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="grid grid-cols-3 gap-4 px-8 pb-20 max-w-4xl mx-auto">
        {[
          { title: 'Screen recorder', desc: 'Record any task — AI writes the steps automatically.' },
          { title: 'AI SOP writer', desc: 'Chat to create or edit any process document.' },
          { title: 'Auto-update alerts', desc: 'Detects process changes and suggests doc updates.' },
          { title: 'Team collaboration', desc: 'Invite teammates, assign ownership, approve SOPs.' },
          { title: 'Export anywhere', desc: 'One-click export to PDF, Notion, or Confluence.' },
          { title: 'Knowledge base Q&A', desc: 'AI searches all SOPs and answers questions instantly.' },
        ].map(f => (
          <div key={f.title} className="bg-gray-50 rounded-xl p-5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg mb-3" />
            <h3 className="font-medium text-gray-900 text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

    </main>
  )
}