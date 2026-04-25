'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function OnboardingFlows() {
  const [user, setUser] = useState(null)
  const [flows, setFlows] = useState([])
  const [sops, setSops] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [flowName, setFlowName] = useState('')
  const [flowDesc, setFlowDesc] = useState('')
  const [steps, setSteps] = useState([{ sop_id: '', day_number: 1 }])
  const [saving, setSaving] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [assignEmployee, setAssignEmployee] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)

    const [{ data: flowData }, { data: sopData }, { data: empData }] = await Promise.all([
      supabase.from('onboarding_flows').select('*, onboarding_steps(*, sops(title))').eq('user_id', user.id),
      supabase.from('sops').select('id, title').eq('user_id', user.id),
      supabase.from('employees').select('*').eq('user_id', user.id)
    ])

    setFlows(flowData || [])
    setSops(sopData || [])
    setEmployees(empData || [])
    setLoading(false)
  }

  const addStep = () => setSteps([...steps, { sop_id: '', day_number: steps.length + 1 }])
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i, field, value) => {
    const updated = [...steps]
    updated[i][field] = value
    setSteps(updated)
  }

  const createFlow = async () => {
    if (!flowName || steps.some(s => !s.sop_id)) {
      alert('Please fill in all fields')
      return
    }
    setSaving(true)

    const { data: flow, error } = await supabase
      .from('onboarding_flows')
      .insert({ user_id: user.id, name: flowName, description: flowDesc })
      .select().single()

    if (!error && flow) {
      const stepsToInsert = steps.map((s, i) => ({
        flow_id: flow.id,
        sop_id: s.sop_id,
        user_id: user.id,
        day_number: parseInt(s.day_number),
        order_index: i
      }))
      await supabase.from('onboarding_steps').insert(stepsToInsert)
      setFlowName('')
      setFlowDesc('')
      setSteps([{ sop_id: '', day_number: 1 }])
      setShowCreate(false)
      await init()
    }
    setSaving(false)
  }

  const assignFlow = async (flowId) => {
    if (!assignEmployee) return
    setAssigning(true)

    const flow = flows.find(f => f.id === flowId)
    if (!flow?.onboarding_steps) { setAssigning(false); return }

    await supabase.from('onboarding_assignments').insert({
      flow_id: flowId,
      employee_id: assignEmployee,
      user_id: user.id,
      started_at: new Date().toISOString(),
      status: 'active'
    })

    for (const step of flow.onboarding_steps) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (step.day_number - 1))
      await supabase.from('assignments').insert({
        user_id: user.id,
        sop_id: step.sop_id,
        employee_id: assignEmployee,
        due_date: dueDate.toISOString(),
        status: 'pending',
        assigned_at: new Date().toISOString()
      })
    }

    setAssignEmployee('')
    setSelectedFlow(null)
    alert('Onboarding flow assigned! Employee will receive SOPs on their scheduled days.')
    setAssigning(false)
  }

  const deleteFlow = async (id) => {
    if (!confirm('Delete this onboarding flow?')) return
    await supabase.from('onboarding_flows').delete().eq('id', id)
    setFlows(flows.filter(f => f.id !== id))
  }

  const groupByDay = (steps) => {
    const grouped = {}
    steps?.forEach(step => {
      const day = step.day_number || 1
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(step)
    })
    return grouped
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Onboarding Flows</span>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + New flow
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Onboarding Flows</h1>
          <p className="text-sm text-gray-500 mt-1">Create SOP sequences that automatically assign to new employees day by day</p>
        </div>

        {/* How it works */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <p className="font-medium text-indigo-900 mb-3">How it works</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: '1', text: 'Create a flow with SOPs assigned to Day 1, Day 3, Day 7 etc.' },
              { step: '2', text: 'Assign the flow to a new employee when they join' },
              { step: '3', text: 'SOPs automatically appear in their queue on the right day' }
            ].map(item => (
              <div key={item.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-indigo-800">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Create flow form */}
        {showCreate && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-4">Create new onboarding flow</h2>

            <div className="flex flex-col gap-3 mb-5">
              <input
                type="text"
                placeholder="Flow name — e.g. New Engineer Onboarding"
                value={flowName}
                onChange={e => setFlowName(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={flowDesc}
                onChange={e => setFlowDesc(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <p className="text-sm font-medium text-gray-700 mb-3">SOPs in this flow</p>

            <div className="flex flex-col gap-3 mb-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">Day</span>
                    <input
                      type="number"
                      min="1"
                      value={step.day_number}
                      onChange={e => updateStep(i, 'day_number', e.target.value)}
                      className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 text-center"
                    />
                  </div>
                  <select
                    value={step.sop_id}
                    onChange={e => updateStep(i, 'sop_id', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 bg-white"
                  >
                    <option value="">Select SOP</option>
                    {sops.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="text-red-400 hover:text-red-600 text-sm px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="text-sm text-indigo-600 hover:text-indigo-800 mb-5"
            >
              + Add another SOP
            </button>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreate(false); setFlowName(''); setFlowDesc(''); setSteps([{ sop_id: '', day_number: 1 }]) }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createFlow}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create flow'}
              </button>
            </div>
          </div>
        )}

        {/* Flows list */}
        {flows.length === 0 && !showCreate ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
            <div className="text-4xl mb-4">🚀</div>
            <p className="font-medium text-gray-700">No onboarding flows yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Create your first flow to automate new employee onboarding</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Create first flow
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {flows.map(flow => {
              const grouped = groupByDay(flow.onboarding_steps)
              const days = Object.keys(grouped).sort((a, b) => a - b)

              return (
                <div key={flow.id} className="bg-white border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{flow.name}</h3>
                      {flow.description && <p className="text-sm text-gray-500 mt-0.5">{flow.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{flow.onboarding_steps?.length || 0} SOPs · {days.length} days</p>
                    </div>
                    <button
                      onClick={() => deleteFlow(flow.id)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Timeline */}
                  <div className="flex flex-col gap-2 mb-5">
                    {days.map(day => (
                      <div key={day} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-14 text-center">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                            Day {day}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          {grouped[day].map(step => (
                            <div key={step.id} className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-sm text-gray-700">{step.sops?.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Assign to employee */}
                  {selectedFlow === flow.id ? (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-3">Assign to employee</p>
                      <div className="flex gap-3">
                        <select
                          value={assignEmployee}
                          onChange={e => setAssignEmployee(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 bg-white"
                        >
                          <option value="">Select employee</option>
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name} — {e.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignFlow(flow.id)}
                          disabled={assigning || !assignEmployee}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                        <button
                          onClick={() => { setSelectedFlow(null); setAssignEmployee('') }}
                          className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      {employees.length === 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          No employees added yet.{' '}
                          <button onClick={() => window.location.href = '/employees'} className="underline">Add employees first</button>
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedFlow(flow.id)}
                      className="w-full py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50"
                    >
                      Assign to new employee
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}