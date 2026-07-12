export function Button({ children, variant = 'primary', size = 'md', loading = false, icon: Icon, className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-brand active:scale-95',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white active:scale-95',
    ghost: 'hover:bg-slate-100 text-slate-600',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-10 px-5 text-sm gap-2',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150
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
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input className={`input-field ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select className={`input-field ${error ? 'error' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea className={`input-field h-auto py-2.5 resize-none ${error ? 'error' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const colors = {
    slate:   'bg-slate-100 text-slate-600',
    amber:   'bg-brand-50 text-brand-700',
    blue:    'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red:     'bg-red-50 text-red-700',
    purple:  'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-card p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
