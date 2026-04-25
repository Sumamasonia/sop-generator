'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Duplicates() {
  const [user, setUser] = useState(null)
  const [sops, setSops] = useState([])
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    const { data } = await supabase.from('sops').select('*').eq('user_id', user.id)
    setSops(data || [])
    setLoading(false)
  }

  const scanDuplicates = async () => {
    setScanning(true)
    try {
      const response = await fetch('/api/detect-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sops })
      })
      const data = await response.json()
      setDuplicates(data.duplicates || [])
      setScanned(true)
    } catch (e) {
      alert('Scan failed. Try again.')
    }
    setScanning(false)
  }

  const mergeSops = async (sop1Id, sop2Id) => {
    if (!confirm('This will delete one SOP and keep the other. Are you sure?')) return
    await supabase.from('sops').delete().eq('id', sop2Id)
    setDuplicates(duplicates.filter(d => !(d.sop1_id === sop1Id && d.sop2_id === sop2Id)))
    setSops(sops.filter(s => s.id !== sop2Id))
    alert('SOP deleted. Please manually merge content into the remaining SOP.')
  }

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return 'text-red-600 bg-red-50 border-red-200'
    if (similarity >= 75) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Duplicate Detector</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Duplicate SOP Detector</h1>
          <p className="text-sm text-gray-500 mt-1">AI scans all your SOPs and finds ones that cover the same process</p>
        </div>

        {/* Scan card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium text-gray-900 mb-2">{sops.length} SOPs ready to scan</p>
          <p className="text-sm text-gray-500 mb-6">AI will compare all your SOPs and find overlapping or duplicate content</p>
          <button
            onClick={scanDuplicates}
            disabled={scanning || sops.length < 2}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {scanning ? 'AI is scanning your SOPs...' : 'Scan for duplicates'}
          </button>
          {sops.length < 2 && (
            <p className="text-xs text-gray-400 mt-3">You need at least 2 SOPs to scan for duplicates</p>
          )}
        </div>

        {/* Results */}
        {scanned && (
          <div>
            {duplicates.length === 0 ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-medium text-green-800">No duplicates found!</p>
                <p className="text-sm text-green-600 mt-1">All your SOPs cover unique processes</p>
              </div>
            ) : (
              <div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-4 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-medium text-amber-800">{duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} found</p>
                    <p className="text-sm text-amber-600">Review these SOPs and consider merging them</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {duplicates.map((d, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getSimilarityColor(d.similarity)}`}>
                          {d.similarity}% similar
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">SOP 1</p>
                          <p className="font-medium text-gray-900 text-sm">{d.sop1_title}</p>
                          <button
                            onClick={() => window.location.href = `/sop/${d.sop1_id}`}
                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-1"
                          >
                            View →
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">SOP 2</p>
                          <p className="font-medium text-gray-900 text-sm">{d.sop2_title}</p>
                          <button
                            onClick={() => window.location.href = `/sop/${d.sop2_id}`}
                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-1"
                          >
                            View →
                          </button>
                        </div>
                      </div>

                      <div className="bg-indigo-50 rounded-xl p-3 mb-4">
                        <p className="text-xs text-indigo-700">
                          <span className="font-medium">AI reason: </span>{d.reason}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/sop/${d.sop1_id}/edit`}
                          className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                          Edit SOP 1
                        </button>
                        <button
                          onClick={() => mergeSops(d.sop1_id, d.sop2_id)}
                          className="flex-1 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Delete SOP 2
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}