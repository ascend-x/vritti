import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { login } from '../api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      
      {/* Left Branding Half */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden items-center justify-center">
        {/* Background Gradients & Patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 to-zinc-950 z-0" />
        <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',backgroundSize:'32px 32px'}} />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-brand-500/10 blur-[100px]" />
           <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex items-center gap-4 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-3xl shadow-brand">
              <Zap className="w-8 h-8 text-brand-950" />
            </div>
            <span className="text-4xl font-black tracking-tight text-white font-display">VRITTI</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-5xl font-bold font-display text-white mb-6 leading-tight">
            Smart Transport <br />
            <span className="text-zinc-500">Operations Platform</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-lg text-zinc-400 font-medium max-w-md leading-relaxed">
            Digitize your vehicle, driver, dispatch, and expense management all in one centralized flow state.
          </motion.p>
        </div>
      </div>

      {/* Right Login Half */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 overflow-hidden">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-brand">
              <Zap className="w-7 h-7 text-brand-950" />
            </div>
            <h1 className="text-3xl font-bold font-display text-zinc-900 dark:text-white">VRITTI</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 font-display">Welcome back</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block mb-2">Email address</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@vritti.com"
                className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 mt-2 bg-brand-500 hover:bg-brand-600 text-brand-950 font-bold rounded-xl
                transition-all duration-150 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 text-base">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
            <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Demo credentials (password: password123)</p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_CREDENTIALS.map(d => (
                <button key={d.email} onClick={() => fillDemo(d.email)}
                  className={`text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${d.color} dark:bg-opacity-10 dark:border-opacity-20`}>
                  <div className="font-bold mb-0.5">{d.role}</div>
                  <div className="opacity-70 truncate font-mono text-[10px]">{d.email}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
