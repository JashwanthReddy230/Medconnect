import clsx from 'clsx'
import { forwardRef } from 'react'

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  { label, error, hint, icon, iconRight, className, required, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            error ? 'input-error' : 'input',
            icon      && 'pl-9',
            iconRight && 'pr-9',
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="error-msg">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
})

// ── TextArea ──────────────────────────────────────────────────────────────────
export const TextArea = forwardRef(function TextArea(
  { label, error, hint, className, required, rows = 4, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          error ? 'input-error' : 'input',
          'resize-y min-h-[80px]',
          className
        )}
        {...props}
      />
      {error && <p className="error-msg">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
})

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className, required, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(error ? 'input-error' : 'input', 'cursor-pointer', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="error-msg">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
})

// ── PasswordInput ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { getPasswordStrength } from '@/utils/validators'

export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, showStrength = false, className, required, ...props },
  ref
) {
  const [show, setShow] = useState(false)
  const strength = showStrength ? getPasswordStrength(props.value || '') : null

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={clsx(
            error ? 'input-error' : 'input',
            'pr-10',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          tabIndex={-1}
        >
          {show
            ? <EyeSlashIcon className="w-4 h-4" />
            : <EyeIcon      className="w-4 h-4" />
          }
        </button>
      </div>
      {showStrength && props.value && (
        <div className="mt-2">
          <div className="flex gap-1 h-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={clsx(
                  'flex-1 rounded-full transition-all duration-300',
                  i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                )}
              />
            ))}
          </div>
          {strength.label && (
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              Password strength: <span className="font-medium">{strength.label}</span>
            </p>
          )}
        </div>
      )}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
})

export default Input

