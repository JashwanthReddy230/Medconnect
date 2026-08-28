import clsx from 'clsx'
import { getInitials } from '@/utils/formatters'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// ── Avatar ────────────────────────────────────────────────────────────────────
const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
}

export function Avatar({ src, name, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={clsx('rounded-full object-cover flex-shrink-0', sizeMap[size], className)}
      />
    )
  }
  return (
    <div
      className={clsx(
        'rounded-full flex-shrink-0 flex items-center justify-center font-semibold',
        'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
        sizeMap[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}

// ── InputField ────────────────────────────────────────────────────────────────
// Generic form input used by registration/forms across the application.
export function InputField({
  label,
  name,
  id,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder = '',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  inputClassName = '',
  ...props
}) {
  const inputId = id || name

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          )}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-help`
              : undefined
        }
        className={clsx(
          'input w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          inputClassName
        )}
        {...props}
      />

      {error ? (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {typeof error === 'string'
            ? error
            : error?.message || 'Invalid value'}
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-help`}
          className="mt-1 text-xs text-slate-500 dark:text-slate-400"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'neutral', dot = false, className }) {
  return (
    <span className={clsx(`badge-${variant}`, className)}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full animate-pulse-dot',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'primary' && 'bg-primary-500',
            variant === 'neutral' && 'bg-slate-400',
          )}
        />
      )}
      {children}
    </span>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, max = 5, size = 'sm', showValue = false, interactive = false, onChange }) {
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating)
        const half = !filled && i < rating

        return interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i + 1)}
            className="text-amber-400 hover:text-amber-500 transition-colors"
          >
            <StarIcon className={starSize} />
          </button>
        ) : (
          <span key={i} className={filled || half ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'}>
            {filled ? (
              <StarIcon className={starSize} />
            ) : (
              <StarOutline className={starSize} />
            )}
          </span>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={clsx(
        'rounded-full border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 animate-spin',
        s[size],
        className
      )}
    />
  )
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-surface-dark">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-muted-light dark:bg-muted-dark flex items-center justify-center mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange, total }) {
  const pageSizes = [10, 20, 50]

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="input py-1 px-2 text-xs w-16"
        >
          {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {total != null && (
          <span className="ml-2">
            {Math.min((page - 1) * pageSize + 1, total)}–
            {Math.min(page * pageSize, total)} of {total}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="btn-ghost btn-sm px-2 disabled:opacity-30"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn-ghost btn-sm px-2 disabled:opacity-30"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p
          if (totalPages <= 5) p = i + 1
          else if (page <= 3) p = i + 1
          else if (page >= totalPages - 2) p = totalPages - 4 + i
          else p = page - 2 + i

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                'btn-sm px-3 rounded-btn text-sm',
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'btn-ghost'
              )}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost btn-sm px-2 disabled:opacity-30"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="btn-ghost btn-sm px-2 disabled:opacity-30"
        >
          »
        </button>
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon, trend, trendLabel, color = 'primary', onClick }) {
  const colorMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400',
    danger: 'bg-red-50    dark:bg-red-900/20    text-red-600    dark:text-red-400',
    info: 'bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400',
  }

  return (
    <div
      className={clsx('stat-card animate-fade-in', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {value ?? '—'}
          </p>
        </div>
        {icon && (
          <div className={clsx('p-2.5 rounded-xl', colorMap[color])}>
            <div className="w-5 h-5">{icon}</div>
          </div>
        )}
      </div>
      {(trend != null || trendLabel) && (
        <div className="flex items-center gap-1 text-xs">
          {trend != null && (
            <span className={clsx(
              'font-semibold',
              trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            )}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className={clsx('w-full card p-0 overflow-hidden animate-slide-up', sizeMap[size])}>
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                  <Dialog.Title className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="btn-ghost p-1.5 rounded-md"
                    aria-label="Close"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}