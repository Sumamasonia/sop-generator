'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function VoiceSop() {
  const [user, setUser] = useState(null)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [supported, setSupported] = useState(true)
  const [timer, setTimer] = useState(0)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    init()
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false)
    }
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
  }

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' '
      }
      setTranscript(fullTranscript.trim())
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setRecording(false)
    }

    recognition.onend = () => {
      setRecording(false)
      clearInterval(timerRef.current)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    setTimer(0)
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const generateSOP = async () => {
    if (!transcript.trim()) return
    setGenerating(true)
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title })
      })
      const data = await response.json()
      if (data.error) { alert(data.error); return }
      setGeneratedContent(data.content)
      if (!title) setTitle(data.suggestedTitle)
    } catch (e) {
      alert('Something went wrong. Try again.')
    }
    setGenerating(false)
  }

  const saveSOP = async () => {
    if (!generatedContent || !user) return
    setSaving(true)
    const { error } = await supabase.from('sops').insert({
      user_id: user.id,
      title: title || 'Voice Generated SOP',
      description: `Generated from voice recording: "${transcript.substring(0, 100)}..."`,
      content: generatedContent,
      created_at: new Date().toISOString()
    })
    if (!error) {
      setSaved(true)
      setTimeout(() => window.location.href = '/dashboard', 1500)
    }
    setSaving(false)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const reset = () => {
    setTranscript('')
    setGeneratedContent('')
    setTitle('')
    setTimer(0)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</button>
        <span className="text-lg font-semibold text-gray-900">SOPly — Voice to SOP</span>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Voice to SOP</h1>
          <p className="text-sm text-gray-500 mt-2">Just talk — describe your process out loud and AI will write the SOP automatically</p>
        </div>

        {!supported && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
            <p className="text-red-700 font-medium">Your browser does not support voice recording</p>
            <p className="text-red-500 text-sm mt-1">Please use Google Chrome for this feature</p>
          </div>
        )}

        {/* Recording card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6 text-center">
          {/* Big mic button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={!supported}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
                recording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                {recording ? (
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
                ) : (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </>
                )}
              </svg>
            </button>
          </div>

          {recording && (
            <div className="mb-4">
              <div className="text-2xl font-mono font-semibold text-red-500 mb-2">{formatTime(timer)}</div>
              <p className="text-sm text-gray-500 animate-pulse">Recording... speak clearly and describe your process</p>
            </div>
          )}

          {!recording && !transcript && (
            <p className="text-gray-400 text-sm">Click the mic and start describing your process</p>
          )}

          {!recording && transcript && (
            <p className="text-sm text-green-600 font-medium">Recording complete — {formatTime(timer)} recorded</p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-900 text-sm">What you said</p>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">Clear & restart</button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">{transcript}</p>

            <div className="mt-4">
              <input
                type="text"
                placeholder="SOP title (optional — AI will suggest one)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 mb-3"
              />
              <button
                onClick={generateSOP}
                disabled={generating}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? 'AI is writing your SOP...' : 'Generate SOP from recording'}
              </button>
            </div>
          </div>
        )}

        {/* Generated SOP */}
        {generatedContent && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-gray-900">Generated SOP</p>
              <div className="flex gap-2">
                {saved ? (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">Saved! Redirecting...</span>
                ) : (
                  <button
                    onClick={saveSOP}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save to dashboard'}
                  </button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{generatedContent}</pre>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}