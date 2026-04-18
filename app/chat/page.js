'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function Chat() {
  const [user, setUser] = useState(null)
  const [sops, setSops] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { init() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    const { data } = await supabase
      .from('sops')
      .select('title, content')
      .eq('user_id', user.id)
    setSops(data || [])
    setInitializing(false)

    setMessages([{
      role: 'assistant',
      text: data?.length > 0
        ? `Hi! I have read all ${data.length} of your SOPs. Ask me anything — I will find the answer from your documentation instantly.`
        : `Hi! You have no SOPs yet. Create some SOPs first and then I can answer questions about them.`
    }])
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sops })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Please try again.'
      }])
    }

    setLoading(false)
  }

  const suggestions = [
    'What is the process for onboarding a new employee?',
    'How do I handle a customer refund?',
    'What are the steps for a code review?',
    'Who is responsible for approving invoices?',
  ]

  if (initializing) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading your knowledge base...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-lg font-semibold text-gray-900">SOPly — AI Assistant</span>
        </div>
        <span className="text-xs text-gray-400">{sops.length} SOPs loaded</span>
      </nav>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto">

        {/* Suggestions — show only at start */}
        {messages.length === 1 && sops.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-3 text-center">Try asking one of these</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-left text-xs p-3 bg-white border border-gray-100 rounded-xl text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium mr-2 mt-1 flex-shrink-0">
                  AI
                </div>
              )}
              <div className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium mr-2 flex-shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={sops.length > 0 ? 'Ask anything about your SOPs...' : 'Create SOPs first to use this feature'}
            disabled={sops.length === 0 || loading}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || sops.length === 0}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI answers based on your SOPs only — not general knowledge
        </p>
      </div>

    </main>
  )
}