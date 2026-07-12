import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { login } from '../api'
import toast from 'react-hot-toast'

const DEMO_CREDENTIALS = [
  { role: 'Fleet Manager',     email: 'admin@vritti.com',    color: 'bg-brand-50 text-brand-700 border-brand-200' },
  { role: 'Dispatcher',        email: 'dispatch@vritti.com', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { role: 'Safety Officer',    email: 'safety@vritti.com',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { role: 'Financial Analyst', email: 'finance@vritti.com',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, accessToken } = await login({ email, password })
      setAuth(user, accessToken)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',backgroundSize:'40px 40px'}} />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-brand">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display text-white">VRITTI</h1>
          <p className="text-slate-400 text-sm mt-1">Smart Transport Operations Platform</p>
          <p className="text-brand-400/70 text-xs mt-0.5 font-medium tracking-wider uppercase">Flow State • वृत्ति</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sign in to your workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email address</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@vritti.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg
                transition-all duration-150 active:scale-95 disabled:opacity-60 shadow-sm hover:shadow-brand">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Demo credentials (password: password123)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map(d => (
                <button key={d.email} onClick={() => fillDemo(d.email)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:scale-[1.02] ${d.color}`}>
                  <div className="font-semibold">{d.role}</div>
                  <div className="opacity-70 truncate">{d.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
