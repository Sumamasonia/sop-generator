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
  const [editingContent, setEditingContent] = useState('') 
  const [isPreviewing, setIsPreviewing] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

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

  // --- Generate Function ---
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

      //  Editor mode 
      setEditingContent(data.content)
      setIsPreviewing(true)
      setShowNew(false)
    } catch (e) {
      alert('Something went wrong. Try again.')
    }
    setGenerating(false)
  }

  // --- Save Function ---
  const saveSOP = async () => {
    const { error } = await supabase.from('sops').insert({
      user_id: user.id,
      title,
      description,
      content: editingContent,
      created_at: new Date().toISOString()
    })

    if (!error) {
      setIsPreviewing(false)
      setEditingContent('')
      setTitle('')
      setDescription('')
      fetchSops(user.id)
    } else {
      alert("Error saving: " + error.message)
    }
  }

  const deleteSop = async (id) => {
    await supabase.from('sops').delete().eq('id', id)
    setSops(sops.filter(s => s.id !== id))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading your workspace...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">SOPly</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your SOPs</h1>
            <p className="text-sm text-gray-500 mt-1">{sops.length} documents</p>
          </div>
          <button
            onClick={() => { setShowNew(true); setIsPreviewing(false); }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            + New SOP
          </button>
        </div>

        {/* 1.SOP Form */}
        {showNew && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">Create new SOP</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="SOP title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
              <textarea
                placeholder="Describe the process..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                <button
                  onClick={generateSOP}
                  disabled={generating || !title || !description}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? 'AI is writing...' : 'Generate with AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Editor Card  */}
        {isPreviewing && (
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="font-bold text-indigo-900 mb-4">✨ Edit & Refine</h2>
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={12}
              className="w-full p-4 border border-gray-200 rounded-xl text-sm font-mono bg-gray-50 outline-none focus:border-indigo-400"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setIsPreviewing(false)} className="px-4 py-2 text-sm text-gray-500">Discard</button>
              <button onClick={saveSOP} className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Save to My SOPs
              </button>
            </div>
          </div>
        )}

        {/* 3. SOP List */}
        <div className="flex flex-col gap-3">
          {sops.map(sop => (
            <div key={sop.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{sop.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{new Date(sop.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => window.location.href = `/sop/${sop.id}`} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">View</button>
                  <button onClick={() => deleteSop(sop.id)} className="px-3 py-1.5 text-xs border border-red-100 rounded-lg text-red-400 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}