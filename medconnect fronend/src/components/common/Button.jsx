import clsx from 'clsx'

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  link:      'text-primary-600 dark:text-primary-400 hover:underline p-0 font-medium text-sm',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={clsx(
        variants[variant],
        variant !== 'link' && sizes[size],
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-btn',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span className="w-4 h-4 flex-shrink-0">{iconRight}</span>
      )}
    </button>
  )
}
