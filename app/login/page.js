'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    if (!email || !password) {
      setError('Please enter email and password')
      setLoading(false)
      return
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">SOPly</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
          />

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
          {message && (
            <p className="text-xs text-green-600 text-center">{message}</p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 mt-1"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            className="text-indigo-600 font-medium"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>

      </div>
    </main>
  )
}