'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function HealthDashboard() {
  const [user, setUser] = useState(null)
  const [sops, setSops] = useState([])
  const [assignments, setAssignments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await Promise.all([
      fetchSops(user.id),
      fetchAssignments(user.id),
      fetchEmployees(user.id)
    ])
    setLoading(false)
  }

  const fetchSops = async (uid) => {
    const { data } = await supabase
      .from('sops')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setSops(data || [])
  }

  const fetchAssignments = async (uid) => {
    const { data } = await supabase
      .from('assignments')
      .select('*, employees(name, email), sops(title)')
      .eq('user_id', uid)
    setAssignments(data || [])
  }

  const fetchEmployees = async (uid) => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', uid)
    setEmployees(data || [])
  }

  const getDaysSince = (date) => {
    if (!date) return 999
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))
  }

  const getHealth = (sop) => {
    const days = getDaysSince(sop.last_reviewed_at || sop.created_at)
    if (days > 90) return { label: 'Outdated', color: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    if (days > 30) return { label: 'Review soon', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
    return { label: 'Healthy', color: 'green', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' }
  }

  const markReviewed = async (sopId) => {
    await supabase
      .from('sops')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', sopId)
    setSops(sops.map(s => s.id === sopId
      ? { ...s, last_reviewed_at: new Date().toISOString() }
      : s
    ))
  }

  // Stats
  const outdated = sops.filter(s => getDaysSince(s.last_reviewed_at || s.created_at) > 90)
  const needsReview = sops.filter(s => {
    const d = getDaysSince(s.last_reviewed_at || s.created_at)
    return d > 30 && d <= 90
  })
  const healthy = sops.filter(s => getDaysSince(s.last_reviewed_at || s.created_at) <= 30)
  const pendingAssignments = assignments.filter(a => a.status === 'pending')
  const completedAssignments = assignments.filter(a => a.status === 'completed')

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading health dashboard...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Dashboard
        </button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Health</span>
        <button
          onClick={() => window.location.href = '/employees'}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Manage employees
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">SOP Health Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track which SOPs are outdated, who owns them, and assignment progress
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-semibold text-gray-900">{sops.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total SOPs</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-semibold text-green-700">{healthy.length}</p>
            <p className="text-xs text-green-500 mt-1">Healthy</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-semibold text-amber-700">{needsReview.length}</p>
            <p className="text-xs text-amber-500 mt-1">Review soon</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-semibold text-red-700">{outdated.length}</p>
            <p className="text-xs text-red-500 mt-1">Outdated</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
            <p className="text-3xl font-semibold text-indigo-700">{employees.length}</p>
            <p className="text-xs text-indigo-500 mt-1">Employees</p>
          </div>
        </div>

        {/* Outdated alert */}
        {outdated.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-red-800">
                {outdated.length} SOP{outdated.length > 1 ? 's are' : ' is'} outdated
              </p>
              <p className="text-sm text-red-500 mt-0.5">
                Not reviewed in over 90 days — review and update these immediately
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        )}

        {/* Assignment progress */}
        {assignments.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">Assignment overview</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-3 rounded-full transition-all"
                  style={{ width: `${assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {completedAssignments.length} / {assignments.length} completed
              </span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {pendingAssignments.length} pending
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {completedAssignments.length} completed
              </span>
            </div>
          </div>
        )}

        {/* SOP health list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">SOP health status</h2>
            <p className="text-xs text-gray-400">SOPs not reviewed in 30+ days need attention</p>
          </div>

          {sops.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No SOPs yet — create some from the dashboard
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sops.map(sop => {
                const health = getHealth(sop)
                const days = getDaysSince(sop.last_reviewed_at || sop.created_at)
                const sopAssignments = assignments.filter(a => a.sop_id === sop.id)
                const completed = sopAssignments.filter(a => a.status === 'completed').length

                return (
                  <div key={sop.id} className="px-6 py-4 flex items-center gap-4">

                    {/* Health indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      health.color === 'green' ? 'bg-green-400' :
                      health.color === 'amber' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />

                    {/* SOP info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-medium text-gray-900 text-sm truncate cursor-pointer hover:text-indigo-600"
                          onClick={() => window.location.href = `/sop/${sop.id}`}
                        >
                          {sop.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${health.bg} ${health.text} ${health.border} flex-shrink-0`}>
                          {health.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-400">
                          {days === 999 ? 'Never reviewed' : `Last reviewed ${days} day${days !== 1 ? 's' : ''} ago`}
                        </p>
                        {sopAssignments.length > 0 && (
                          <p className="text-xs text-indigo-500">
                            {completed}/{sopAssignments.length} assigned employees completed
                          </p>
                        )}
                        {sop.owner_email && (
                          <p className="text-xs text-gray-400">
                            Owner: {sop.owner_email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => window.location.href = `/assign/${sop.id}`}
                        className="px-3 py-1.5 text-xs border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-50"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => markReviewed(sop.id)}
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                      >
                        Mark reviewed
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent assignments */}
        {assignments.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Recent assignments</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {assignments.slice(0, 8).map(a => (
                <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{a.employees?.name}</span>
                      <span className="text-gray-400"> · </span>
                      <span className="text-gray-600">{a.sops?.title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Assigned {new Date(a.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    a.status === 'completed'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {a.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}