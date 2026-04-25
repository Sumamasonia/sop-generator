'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Roles() {
  const [user, setUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const [roles, setRoles] = useState([])
  const [sops, setSops] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)

    const [{ data: empData }, { data: roleData }, { data: sopData }] = await Promise.all([
      supabase.from('employees').select('*').eq('user_id', user.id),
      supabase.from('team_roles').select('*').eq('user_id', user.id),
      supabase.from('sops').select('id, title').eq('user_id', user.id)
    ])

    setEmployees(empData || [])
    setRoles(roleData || [])
    setSops(sopData || [])
    setLoading(false)
  }

  const getRole = (employeeId) => {
    return roles.find(r => r.employee_id === employeeId)?.role || 'viewer'
  }

  const updateRole = async (employeeId, newRole) => {
    setSaving(employeeId)
    const existing = roles.find(r => r.employee_id === employeeId)

    if (existing) {
      await supabase.from('team_roles').update({ role: newRole }).eq('id', existing.id)
      setRoles(roles.map(r => r.employee_id === employeeId ? { ...r, role: newRole } : r))
    } else {
      const { data } = await supabase.from('team_roles').insert({
        user_id: user.id,
        employee_id: employeeId,
        role: newRole
      }).select().single()
      if (data) setRoles([...roles, data])
    }
    setSaving(null)
  }

  const roleColors = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    manager: 'bg-blue-50 text-blue-700 border-blue-200',
    editor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    viewer: 'bg-gray-50 text-gray-600 border-gray-200'
  }

  const roleDescriptions = {
    admin: 'Can create, edit, delete, approve all SOPs and manage team',
    manager: 'Can create and edit SOPs, approve submissions, view all reports',
    editor: 'Can create and edit SOPs but cannot approve or delete',
    viewer: 'Can only view and read assigned SOPs'
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const colors = ['bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Role Management</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Role Based Access</h1>
          <p className="text-sm text-gray-500 mt-1">Control what each team member can see and do in SOPly</p>
        </div>

        {/* Role legend */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {Object.entries(roleDescriptions).map(([role, desc]) => (
            <div key={role} className={`border rounded-xl p-4 ${roleColors[role]}`}>
              <p className="font-medium text-sm capitalize mb-1">{role}</p>
              <p className="text-xs opacity-80">{desc}</p>
            </div>
          ))}
        </div>

        {/* Employee roles */}
        {employees.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium text-gray-700">No employees added yet</p>
            <button
              onClick={() => window.location.href = '/employees'}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Add employees first
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {employees.map((emp, i) => {
              const currentRole = getRole(emp.id)
              return (
                <div key={emp.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${colors[i % colors.length]}`}>
                      {initials(emp.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                      {emp.department && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{emp.department}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {saving === emp.id && (
                      <span className="text-xs text-gray-400">Saving...</span>
                    )}
                    <select
                      value={currentRole}
                      onChange={e => updateRole(emp.id, e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm border font-medium outline-none cursor-pointer ${roleColors[currentRole]}`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {employees.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-6">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Note:</span> Role enforcement on specific pages is coming soon. Currently roles are tracked and displayed — full access control will be applied in the next update.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}