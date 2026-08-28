import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { validators } from '@/utils/validators'
import { appointmentService } from '@/api/services'
import { Input, PasswordInput } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registered = searchParams.get('registered')
  const expired = searchParams.get('session') === 'expired'
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setServerError('')
    try {
      await login(data)

      // Resume a booking that was started as a guest on a doctor's public
      // profile page (Book Appointment → not logged in → saved here → Login).
      const pendingRaw = localStorage.getItem('mc_pending_booking')
      if (pendingRaw) {
        localStorage.removeItem('mc_pending_booking')
        try {
          const pending = JSON.parse(pendingRaw)
          if (pending?.doctorId && pending?.slot) {
            await appointmentService.book(pending)
            toast.success(
              `Appointment with ${pending.doctorName || 'the doctor'} booked — waiting for the doctor to confirm.`
            )
            navigate('/patient/appointments')
          }
        } catch (bookErr) {
          toast.error(
            bookErr?.response?.data?.message || 'We could not complete your saved booking automatically. Please book again.'
          )
        }
      }
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-8">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Your health,<br />better connected.
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed max-w-md">
            Access trusted doctors, book appointments instantly, and manage your healthcare — all in one place.
          </p>
          <div className="mt-12 space-y-4">
            {[
              ['10,000+', 'Verified Doctors'],
              ['500+', 'Partner Hospitals'],
              ['2M+', 'Patients Served'],
            ].map(([stat, label]) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-2xl font-bold">{stat}</span>
                <span className="text-primary-200 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-muted-light dark:bg-surface-dark">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              Med<span className="text-primary-600">Connect</span>
            </span>
          </div>

          <div className="card p-8 animate-fade-in">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sign in</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Welcome back — sign in to your account
              </p>
            </div>

            {/* Banners */}
            {registered && (
              <div className="mb-5 flex items-start gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm">
                <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Registration submitted! Pending admin approval — you'll be notified by email.
              </div>
            )}
            {expired && (
              <div className="mb-5 flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Your session expired. Please sign in again.
              </div>
            )}
            {serverError && (
              <div className="mb-5 flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                required
                icon={<EnvelopeIcon className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email', validators.email)}
              />
              <div>
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  required
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <div className="flex justify-end mt-1">
                  <Link to="/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-2">
                Sign in
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light dark:border-border-dark" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-slate-400 bg-card-light dark:bg-card-dark">or continue with</span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              className="btn btn-secondary w-full gap-3"
              onClick={() => toast('Google login integration — add your Google Client ID', { icon: 'ℹ️' })}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}