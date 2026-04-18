'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function ReadReceipts({ params }) {
  const { id } = use(params)
  const [sop, setSop] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [reads, setReads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const [{ data: sopData }, { data: assignData }, { data: readData }] = await Promise.all([
      supabase.from('sops').select('*').eq('id', id).single(),
      supabase.from('assignments').select('*, employees(name, email, department)').eq('sop_id', id).eq('user_id', user.id),
      supabase.from('sop_reads').select('*').eq('sop_id', id).eq('user_id', user.id)
    ])

    setSop(sopData)
    setAssignments(assignData || [])
    setReads(readData || [])
    setLoading(false)
  }

  const hasRead = (employeeId) => reads.find(r => r.employee_id === employeeId)

  const readCount = assignments.filter(a => hasRead(a.employee_id)).length
  const readPercent = assignments.length > 0 ? Math.round((readCount / assignments.length) * 100) : 0

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading read receipts...
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
        <span className="text-lg font-semibold text-gray-900">Read Receipts</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{sop?.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Track which employees have read this SOP</p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-gray-900">Reading progress</p>
            <p className="text-2xl font-semibold text-indigo-600">{readPercent}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all"
              style={{ width: `${readPercent}%` }}
            />
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-green-600 font-medium">{readCount} read</span>
            <span className="text-gray-400">{assignments.length - readCount} not read</span>
            <span className="text-gray-400">{assignments.length} total assigned</span>
          </div>
        </div>

        {/* Employee list */}
        {assignments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👁️</div>
            <p className="font-medium text-gray-600">No employees assigned yet</p>
            <p className="text-sm mt-1">Assign this SOP to employees to track who has read it</p>
            <button
              onClick={() => window.location.href = `/assign/${id}`}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Assign employees
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assignments.map((a, i) => {
              const read = hasRead(a.employee_id)
              return (
                <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      read ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {initials(a.employees?.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{a.employees?.name}</p>
                      <p className="text-xs text-gray-400">{a.employees?.email}</p>
                      {a.employees?.department && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {a.employees?.department}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {read ? (
                      <div>
                        <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
                          Read
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(read.read_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded-full">
                        Not read yet
                      </span>
                    )}
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