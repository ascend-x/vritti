export function Button({ children, variant = 'primary', size = 'md', loading = false, icon: Icon, className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-400 text-zinc-950 shadow-brand hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 hover:-translate-y-0.5 active:translate-y-0 shadow-sm',
    danger: 'bg-red-500 hover:bg-red-400 text-white shadow-sm hover:-translate-y-0.5 active:translate-y-0',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 active:scale-95',
    success: 'bg-brand-500 hover:bg-brand-400 text-zinc-950 shadow-brand hover:-translate-y-0.5 active:translate-y-0',
  };
  const sizes = {
    sm: 'h-9 px-4 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-sm gap-2',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-bold rounded-full transition-all duration-200
        ${variants[variant]} ${sizes[size]} ${className}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">{label}</label>}
      <input className={`input-field ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">{label}</label>}
      <select className={`input-field ${error ? 'error' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">{label}</label>}
      <textarea className={`input-field h-auto py-3 resize-none ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const colors = {
    slate:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    amber:   'bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400',
    blue:    'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red:     'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    purple:  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white dark:bg-zinc-900/90 rounded-3xl shadow-soft dark:shadow-none border border-zinc-100/50 dark:border-white/5 p-6 transition-colors ${className}`} {...props}>
      {children}
    </div>
  );
}
