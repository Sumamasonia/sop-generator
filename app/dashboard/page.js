'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [sops, setSops] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { getUser() }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    fetchSops(user.id)
  }

  const fetchSops = async (userId) => {
    const { data } = await supabase
      .from('sops')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setSops(data || [])
    setLoading(false)
  }

  const generateSOP = async () => {
    if (!title || !description) return
    setGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      const data = await response.json()
      const { error } = await supabase.from('sops').insert({
        user_id: user.id,
        title,
        description,
        content: data.content,
        created_at: new Date().toISOString()
      })
      if (!error) {
        setTitle('')
        setDescription('')
        setShowNew(false)
        fetchSops(user.id)
      }
    } catch (e) {
      alert('Something went wrong. Try again.')
    }
    setGenerating(false)
  }

  const deleteSop = async (id) => {
    if (!confirm('Delete this SOP?')) return
    await supabase.from('sops').delete().eq('id', id)
    setSops(sops.filter(s => s.id !== id))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const filtered = sops.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading your workspace...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div className="flex items-center gap-4">
  <button
    onClick={() => window.location.href = '/templates'}
    className="text-sm text-gray-500 hover:text-gray-800"
  >
    Templates
  </button>
  <button
    onClick={() => window.location.href = '/health'}
    className="text-sm text-gray-500 hover:text-gray-800"
  >
    Health
  </button>
  <button
    onClick={() => window.location.href = '/approval'}
    className="text-sm text-gray-500 hover:text-gray-800"
  >
    Approvals
  </button>
  <button
    onClick={() => window.location.href = '/chat'}
    className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
  >
    AI Assistant
  </button>
  <span className="text-sm text-gray-400">{user?.email}</span>
  <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800">
    Sign out
  </button>
  
  <button
  onClick={() => window.location.href = '/voice-sop'}
  className="text-sm text-gray-500 hover:text-gray-800"
>
  🎤 Voice
</button>
<button
  onClick={() => window.location.href = '/onboarding'}
  className="text-sm text-gray-500 hover:text-gray-800"
>
  Onboarding
</button>
<button
  onClick={() => window.location.href = '/roles'}
  className="text-sm text-gray-500 hover:text-gray-800"
>
  Roles
</button>
<button
  onClick={() => window.location.href = '/duplicates'}
  className="text-sm text-gray-500 hover:text-gray-800"
>
  Duplicates
</button>
</div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-1">Total SOPs</p>
            <p className="text-3xl font-semibold text-gray-900">{sops.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-1">This month</p>
            <p className="text-3xl font-semibold text-gray-900">
              {sops.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length}
            </p>
          </div>
          <div className="bg-indigo-600 border border-indigo-600 rounded-2xl p-5 cursor-pointer hover:bg-indigo-700"
            onClick={() => window.location.href = '/templates'}>
            <p className="text-xs text-indigo-200 mb-1">Quick start</p>
            <p className="text-sm font-medium text-white">Browse templates →</p>
          </div>
        </div>

        {/* Header + actions */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Your SOPs</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search SOPs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 w-48"
            />
            <button
              onClick={() => window.location.href = '/templates'}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Use template
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + New SOP
            </button>
          </div>
        </div>

        {/* New SOP form */}
        {showNew && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <h2 className="font-medium text-gray-900 mb-4">Create new SOP</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="SOP title — e.g. How to onboard a new employee"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
              <textarea
                placeholder="Describe the process in plain English..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowNew(false); setTitle(''); setDescription('') }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={generateSOP}
                  disabled={generating || !title || !description}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? 'AI is writing your SOP...' : 'Generate with AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOP list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {search ? (
              <p>No SOPs found for "{search}"</p>
            ) : (
              <>
                <div className="text-4xl mb-4">📄</div>
                <p className="font-medium text-gray-600">No SOPs yet</p>
                <p className="text-sm mt-1">Click "New SOP" or pick a template to get started</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(sop => (
              <div
                key={sop.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => window.location.href = `/sop/${sop.id}`}>
                    <h3 className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                      {sop.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(sop.created_at)}</p>
                    {sop.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-1">{sop.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => window.location.href = `/sop/${sop.id}/edit`}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => window.location.href = `/sop/${sop.id}`}
                      className="px-3 py-1.5 text-xs border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteSop(sop.id)}
                      className="px-3 py-1.5 text-xs border border-red-100 rounded-lg text-red-400 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}