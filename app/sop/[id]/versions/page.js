'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function Versions({ params }) {
  const { id } = use(params)
  const [versions, setVersions] = useState([])
  const [sop, setSop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const [{ data: sopData }, { data: versionData }] = await Promise.all([
      supabase.from('sops').select('*').eq('id', id).single(),
      supabase.from('sop_versions').select('*').eq('sop_id', id).order('version_number', { ascending: false })
    ])

    setSop(sopData)
    setVersions(versionData || [])
    setLoading(false)
  }

  const restore = async (version) => {
    if (!confirm(`Restore version ${version.version_number}? Current content will be saved as a new version first.`)) return
    setRestoring(version.id)

    await supabase.from('sop_versions').insert({
      sop_id: id,
      user_id: version.user_id,
      content: sop.content,
      title: sop.title,
      version_number: sop.version_number || versions.length + 1,
      change_note: 'Auto-saved before restore',
      created_at: new Date().toISOString()
    })

    await supabase.from('sops').update({
      content: version.content,
      title: version.title,
      updated_at: new Date().toISOString(),
      version_number: (sop.version_number || 1) + 1
    }).eq('id', id)

    setRestoring(null)
    window.location.href = `/sop/${id}`
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading version history...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = `/sop/${id}`}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back to SOP
        </button>
        <span className="text-lg font-semibold text-gray-900">Version History</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{sop?.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{versions.length} saved version{versions.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Current version */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>
                <p className="font-medium text-gray-900 text-sm">Version {sop?.version_number || 1}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated {sop?.updated_at
                  ? new Date(sop.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Never'}
              </p>
            </div>
            <button
              onClick={() => window.location.href = `/sop/${id}/edit`}
              className="px-3 py-1.5 text-xs border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-100"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Past versions */}
        {versions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🕐</div>
            <p className="font-medium text-gray-600">No version history yet</p>
            <p className="text-sm mt-1">Versions are saved automatically every time you save the SOP editor</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {versions.map((v, i) => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">Version {v.version_number}</p>
                      {i === 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Previous</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(v.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                      className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      {expanded === v.id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => restore(v)}
                      disabled={restoring === v.id}
                      className="px-3 py-1.5 text-xs border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {restoring === v.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
                {expanded === v.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <p className="text-xs text-gray-500 font-medium mb-2">Content preview</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
                      {v.content?.substring(0, 500)}...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}