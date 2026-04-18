'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AssignSop({ params }) {
  const { id } = use(params)
  const [user, setUser] = useState(null)
  const [sop, setSop] = useState(null)
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await Promise.all([fetchSop(), fetchEmployees(user.id), fetchAssignments(user.id)])
    setLoading(false)
  }

  const fetchSop = async () => {
    const { data } = await supabase.from('sops').select('*').eq('id', id).single()
    setSop(data)
  }

  const fetchEmployees = async (uid) => {
    const { data } = await supabase.from('employees').select('*').eq('user_id', uid)
    setEmployees(data || [])
  }

  const fetchAssignments = async (uid) => {
    const { data } = await supabase
      .from('assignments')
      .select('*, employees(name, email)')
      .eq('user_id', uid)
      .eq('sop_id', id)
    setAssignments(data || [])
  }

  const toggleEmployee = (empId) => {
    setSelected(prev =>
      prev.includes(empId) ? prev.filter(e => e !== empId) : [...prev, empId]
    )
  }

  const assign = async () => {
    if (selected.length === 0) return
    setSaving(true)

    const toInsert = selected
      .filter(empId => !assignments.find(a => a.employee_id === empId))
      .map(empId => ({
        user_id: user.id,
        sop_id: id,
        employee_id: empId,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'pending',
        assigned_at: new Date().toISOString()
      }))

    if (toInsert.length > 0) {
      await supabase.from('assignments').insert(toInsert)
    }

    await fetchAssignments(user.id)
    setSelected([])
    setDueDate('')
    setSaving(false)
  }

  const markComplete = async (assignmentId) => {
    await supabase
      .from('assignments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', assignmentId)
    setAssignments(assignments.map(a =>
      a.id === assignmentId
        ? { ...a, status: 'completed', completed_at: new Date().toISOString() }
        : a
    ))
  }

  const removeAssignment = async (assignmentId) => {
    await supabase.from('assignments').delete().eq('id', assignmentId)
    setAssignments(assignments.filter(a => a.id !== assignmentId))
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const alreadyAssigned = (empId) => assignments.find(a => a.employee_id === empId)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/health'}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Health dashboard
        </button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Assign</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* SOP title */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <p className="text-xs text-gray-400 mb-1">Assigning SOP</p>
          <h1 className="text-xl font-semibold text-gray-900">{sop?.title}</h1>
          <button
            onClick={() => window.location.href = `/sop/${id}`}
            className="text-xs text-indigo-500 hover:text-indigo-700 mt-2 inline-block"
          >
            View SOP →
          </button>
        </div>

        {/* Assign form */}
        {employees.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-6 text-center">
            <p className="text-amber-800 font-medium text-sm">No employees added yet</p>
            <p className="text-amber-600 text-xs mt-1 mb-3">Add your team members first before assigning SOPs</p>
            <button
              onClick={() => window.location.href = '/employees'}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
            >
              Add employees
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">Select employees to assign</h2>

            <div className="flex flex-col gap-2 mb-4">
              {employees.map(emp => {
                const assigned = alreadyAssigned(emp.id)
                const isSelected = selected.includes(emp.id)
                return (
                  <div
                    key={emp.id}
                    onClick={() => !assigned && toggleEmployee(emp.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      assigned
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-indigo-300 bg-indigo-50 cursor-pointer'
                        : 'border-gray-100 hover:border-indigo-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {initials(emp.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                    {assigned ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Already assigned
                      </span>
                    ) : isSelected ? (
                      <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                        Selected
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Due date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div className="pt-5">
                <button
                  onClick={assign}
                  disabled={saving || selected.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {saving ? 'Assigning...' : `Assign to ${selected.length || ''} employee${selected.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current assignments */}
        {assignments.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Current assignments</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {assignments.map(a => (
                <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {initials(a.employees?.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.employees?.name}</p>
                      <p className="text-xs text-gray-400">
                        {a.employees?.email}
                        {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {a.completed_at && ` · Completed ${new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'completed'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {a.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    {a.status === 'pending' && (
                      <button
                        onClick={() => markComplete(a.id)}
                        className="text-xs text-green-600 border border-green-100 px-2 py-1 rounded-lg hover:bg-green-50"
                      >
                        Mark done
                      </button>
                    )}
                    <button
                      onClick={() => removeAssignment(a.id)}
                      className="text-xs text-red-400 border border-red-100 px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}