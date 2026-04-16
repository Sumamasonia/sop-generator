'use client'
import { useState } from 'react'
import Link from 'next/link' // 1. Link import karna zaroori hai

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!email || !email.includes('@')) return
    setSubmitted(true)
    setEmail('')
    // Waitlist ke baad bhi hum unhein login par bhej sakte hain
    setTimeout(() => {
        window.location.href = '/login'
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div className="flex gap-3">
          {/* 2. Sign in button ko Link mein wrap kiya */}
          <Link href="/login">
            <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
              Sign in
            </button>
          </Link>
          
          {/* 3. Get started free ko bhi Link mein wrap kiya */}
          <Link href="/login">
            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Get started free
            </button>
          </Link>
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
            {/* 4. Join waitlist button ko functionality di ya seedha redirect karein */}
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="text-green-600 font-medium">
            Success! Redirecting you to login...
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Free to use · No credit card needed
        </p>
      </section>

      {/* Stats aur Features wala part waisa hi rahega... */}
      {/* ... (Existing stats and features sections) ... */}

    </main>
  )
}