'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Employees() {
  const [user, setUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    fetchEmployees(user.id)
  }

  const fetchEmployees = async (uid) => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setEmployees(data || [])
    setLoading(false)
  }

  const addEmployee = async () => {
    if (!name || !email) return
    setSaving(true)
    const { error } = await supabase.from('employees').insert({
      user_id: user.id,
      name,
      email,
      department,
      created_at: new Date().toISOString()
    })
    if (!error) {
      setName('')
      setEmail('')
      setDepartment('')
      setShowForm(false)
      fetchEmployees(user.id)
    }
    setSaving(false)
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Remove this employee?')) return
    await supabase.from('employees').delete().eq('id', id)
    setEmployees(employees.filter(e => e.id !== id))
  }

  const departments = ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 'Support', 'Other']

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-purple-100 text-purple-700',
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading employees...
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
        <span className="text-lg font-semibold text-gray-900">SOPly — Employees</span>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Add employee
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add team members to assign SOPs and track completion
          </p>
        </div>

        {/* Add employee form */}
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">Add new employee</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="email"
                placeholder="Work email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 mb-4 bg-white"
            >
              <option value="">Select department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowForm(false); setName(''); setEmail(''); setDepartment('') }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addEmployee}
                disabled={saving || !name || !email}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add employee'}
              </button>
            </div>
          </div>
        )}

        {/* Employee list */}
        {employees.length === 0 && !showForm ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-4">👥</div>
            <p className="font-medium text-gray-600">No employees yet</p>
            <p className="text-sm mt-1">Add your team members to start assigning SOPs</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {employees.map((emp, i) => (
              <div key={emp.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${colors[i % colors.length]}`}>
                    {initials(emp.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{emp.email}</p>
                    {emp.department && (
                      <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1">
                        {emp.department}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteEmployee(emp.id)}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}