'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Approval() {
  const [user, setUser] = useState(null)
  const [sops, setSops] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    fetchSops(user.id)
  }

  const fetchSops = async (uid) => {
    const { data } = await supabase
      .from('sops')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setSops(data || [])
    setLoading(false)
  }

  const submitForApproval = async (sopId) => {
    await supabase.from('sops').update({
      approval_status: 'pending',
      submitted_at: new Date().toISOString()
    }).eq('id', sopId)
    setSops(sops.map(s => s.id === sopId
      ? { ...s, approval_status: 'pending', submitted_at: new Date().toISOString() }
      : s
    ))
  }

  const approve = async (sopId) => {
    await supabase.from('sops').update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.email,
      rejection_reason: null
    }).eq('id', sopId)
    setSops(sops.map(s => s.id === sopId
      ? { ...s, approval_status: 'approved', approved_at: new Date().toISOString() }
      : s
    ))
  }

  const reject = async (sopId) => {
    const reason = prompt('Enter reason for rejection:')
    if (!reason) return
    await supabase.from('sops').update({
      approval_status: 'rejected',
      rejection_reason: reason
    }).eq('id', sopId)
    setSops(sops.map(s => s.id === sopId
      ? { ...s, approval_status: 'rejected', rejection_reason: reason }
      : s
    ))
  }

  const resetToDraft = async (sopId) => {
    await supabase.from('sops').update({
      approval_status: 'draft',
      submitted_at: null,
      approved_at: null,
      rejection_reason: null
    }).eq('id', sopId)
    setSops(sops.map(s => s.id === sopId
      ? { ...s, approval_status: 'draft' }
      : s
    ))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600 border-green-200'
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'rejected': return 'bg-red-50 text-red-600 border-red-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  const filtered = filter === 'all' ? sops : sops.filter(s => (s.approval_status || 'draft') === filter)

  const counts = {
    all: sops.length,
    draft: sops.filter(s => !s.approval_status || s.approval_status === 'draft').length,
    pending: sops.filter(s => s.approval_status === 'pending').length,
    approved: sops.filter(s => s.approval_status === 'approved').length,
    rejected: sops.filter(s => s.approval_status === 'rejected').length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading approval workflow...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Dashboard
        </button>
        <span className="text-lg font-semibold text-gray-900">Approval Workflow</span>
        <div />
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">SOP Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit SOPs for approval before publishing to your team
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Draft', key: 'draft', color: 'text-gray-700' },
            { label: 'Pending review', key: 'pending', color: 'text-amber-600' },
            { label: 'Approved', key: 'approved', color: 'text-green-600' },
            { label: 'Rejected', key: 'rejected', color: 'text-red-600' },
          ].map(s => (
            <div key={s.key} className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-semibold ${s.color}`}>{counts[s.key]}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors capitalize ${
                filter === f
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {f} {f !== 'all' && `(${counts[f]})`}
            </button>
          ))}
        </div>

        {/* SOP list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium text-gray-600">No SOPs in this category</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(sop => {
              const status = sop.approval_status || 'draft'
              return (
                <div key={sop.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-medium text-gray-900 text-sm cursor-pointer hover:text-indigo-600"
                          onClick={() => window.location.href = `/sop/${sop.id}`}
                        >
                          {sop.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(status)}`}>
                          {status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400">
                        Created {new Date(sop.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {sop.submitted_at && ` · Submitted ${new Date(sop.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {sop.approved_at && ` · Approved ${new Date(sop.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {sop.approved_by && ` by ${sop.approved_by}`}
                      </p>

                      {status === 'rejected' && sop.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600">
                            <span className="font-medium">Rejection reason: </span>
                            {sop.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {status === 'draft' && (
                        <button
                          onClick={() => submitForApproval(sop.id)}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Submit for approval
                        </button>
                      )}
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(sop.id)}
                            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(sop.id)}
                            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(status === 'approved' || status === 'rejected') && (
                        <button
                          onClick={() => resetToDraft(sop.id)}
                          className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
                        >
                          Reset to draft
                        </button>
                      )}
                      <button
                        onClick={() => window.location.href = `/sop/${sop.id}/edit`}
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}