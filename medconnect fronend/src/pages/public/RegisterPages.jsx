import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  UserIcon, UserGroupIcon, BuildingOffice2Icon,
  CheckIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { validators } from '@/utils/validators'
import { Input, Select, TextArea, PasswordInput } from '@/components/common/FormFields.jsx'
import MobileOtpVerification from '@/components/common/MobileOtpVerification.jsx'
import Button from '@/components/common/Button.jsx'
import { hospitalService } from '@/api/services'
import { authService } from '@/api/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const parseServerError = (err) => {
  const data = err?.response?.data
  if (!data) return 'Registration failed. Please try again.'
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    if (data.message) return data.message
    return Object.values(data).join(', ')
  }
  return 'Registration failed. Please try again.'
}

// ── Role selector ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    id:          'patient',
    label:       'Patient',
    description: 'Find doctors and book appointments',
    icon:        UserIcon,
    color:       'primary',
  },
  {
    id:          'doctor',
    label:       'Doctor',
    description: 'List your practice and connect with patients',
    icon:        UserGroupIcon,
    color:       'success',
  },
  {
    id:          'hospital',
    label:       'Hospital / Clinic',
    description: 'Register your facility and manage your team',
    icon:        BuildingOffice2Icon,
    color:       'info',
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-muted-light dark:bg-surface-dark">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">
              Med<span className="text-primary-600">Connect</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Choose how you'll use MedConnect</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isSelected = selected === role.id
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={clsx(
                  'card p-6 text-left transition-all duration-150 border-2',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-transparent hover:border-primary-200 dark:hover:border-primary-800'
                )}
              >
                <div className={clsx(
                  'w-11 h-11 rounded-xl flex items-center justify-center mb-3',
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-muted-light dark:bg-muted-dark text-slate-500 dark:text-slate-400'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{role.label}</span>
                  {isSelected && <CheckIcon className="w-4 h-4 text-primary-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{role.description}</p>
              </button>
            )
          })}
        </div>

        <Button
          className="w-full"
          disabled={!selected}
          onClick={() => navigate(`/register/${selected}`)}
        >
          Continue as {selected ? ROLES.find((r) => r.id === selected)?.label : '…'}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Shared form wrapper ───────────────────────────────────────────────────────
function AuthFormWrapper({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-muted-light dark:bg-surface-dark">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-white">
              Med<span className="text-primary-600">Connect</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="card p-8">{children}</div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

// ── Patient Registration ───────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))

export function PatientRegisterPage() {
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [mobileVerified, setMobileVerified] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors }, watch } = useForm()

  const passwordValue = watch('password', '')
  const phoneValue = watch('phone', '')

  const onSubmit = async (data) => {
    if (!mobileVerified) {
      toast.error('Please verify your mobile number before creating your account.')
      return
    }

    setLoading(true)
    setServerError('')
    try {
      await registerUser({ ...data, role: 'patient' }, 'patient')
    } catch (err) {
      setServerError(parseServerError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormWrapper title="Create patient account" subtitle="Book appointments and manage your health">
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" placeholder="Jane" required error={errors.firstName?.message}
            {...register('firstName', validators.name)} />
          <Input label="Last name" placeholder="Smith" required error={errors.lastName?.message}
            {...register('lastName', validators.name)} />
        </div>
        <Input label="Email address" type="email" placeholder="you@example.com" required error={errors.email?.message}
          {...register('email', validators.email)} />
        
        <div>
          <div className="flex items-end gap-2 w-full">
            <div className="flex-1 min-w-0">
              <Input label="Phone number" type="tel" placeholder="+91 9876543210" required error={errors.phone?.message}
                {...register('phone', validators.phone)} />
            </div>
            <div className="flex-shrink-0 mb-[1px]">
              <MobileOtpVerification
                phone={phoneValue}
                onVerifiedChange={setMobileVerified}
                disabled={loading}
              />
            </div>
          </div>
          {mobileVerified && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Mobile number verified successfully.
            </p>
          )}
        </div>

        <Input label="Date of birth" type="date" required error={errors.dateOfBirth?.message}
          {...register('dateOfBirth', { required: 'Date of birth is required' })} />
        <Select
          label="Blood group"
          options={BLOOD_GROUPS}
          placeholder="Select blood group"
          error={errors.bloodGroup?.message}
          {...register('bloodGroup')}
        />
        <PasswordInput
          label="Password" placeholder="••••••••" required showStrength value={passwordValue}
          error={errors.password?.message}
          {...register('password', validators.password)}
        />
        <PasswordInput
          label="Confirm password" placeholder="••••••••" required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', validators.confirmPassword(getValues))}
        />
        <Button type="submit" loading={loading} disabled={!mobileVerified} className="w-full mt-2">Create patient account</Button>
      </form>
    </AuthFormWrapper>
  )
}

// ── Doctor Registration ────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Gynecologist',
  'Oncologist', 'Urologist', 'ENT Specialist', 'Ophthalmologist',
  'Radiologist', 'Anesthesiologist', 'Dentist', 'Other',
].map((v) => ({ value: v, label: v }))

export function DoctorRegisterPage() {
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [hospitals, setHospitals] = useState([])
  const [mobileVerified, setMobileVerified] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors }, watch } = useForm()
  const passwordValue = watch('password', '')
  const phoneValue = watch('phone', '')

  useEffect(() => {
    hospitalService.getAll()
      .then((res) => {
        setHospitals(res.data.map(h => ({ value: h.id, label: h.hospitalName })))
      })
      .catch((err) => {
        console.error('Failed to load hospitals for selection dropdown:', err)
      })
  }, [])

  const onSubmit = async (data) => {
    if (!mobileVerified) {
      toast.error('Please verify your mobile number before submitting.')
      return
    }

    setLoading(true)
    setServerError('')
    try {
      await registerUser({ ...data, role: 'doctor' }, 'doctor')
    } catch (err) {
      setServerError(parseServerError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormWrapper title="Register as a doctor" subtitle="Your registration will be reviewed by our team (1–2 business days)">
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" placeholder="Dr. Jane" required error={errors.firstName?.message}
            {...register('firstName', validators.name)} />
          <Input label="Last name" placeholder="Smith" required error={errors.lastName?.message}
            {...register('lastName', validators.name)} />
        </div>
        <Input label="Email address" type="email" placeholder="doctor@clinic.com" required error={errors.email?.message}
          {...register('email', validators.email)} />
        
        <div>
          <div className="flex items-end gap-2 w-full">
            <div className="flex-1 min-w-0">
              <Input label="Phone number" type="tel" placeholder="+91 9876543210" required error={errors.phone?.message}
                {...register('phone', validators.phone)} />
            </div>
            <div className="flex-shrink-0 mb-[1px]">
              <MobileOtpVerification
                phone={phoneValue}
                onVerifiedChange={setMobileVerified}
                disabled={loading}
              />
            </div>
          </div>
          {mobileVerified && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Mobile number verified successfully.
            </p>
          )}
        </div>

        <Select
          label="Hospital" options={hospitals} placeholder="Select hospital"
          required error={errors.hospitalId?.message}
          {...register('hospitalId', { required: 'Hospital is required' })}
        />
        <Select
          label="Specialization" options={SPECIALIZATIONS} placeholder="Select specialization"
          required error={errors.specialization?.message}
          {...register('specialization', { required: 'Specialization is required' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="License number" placeholder="MED-12345" required error={errors.licenseNumber?.message}
            {...register('licenseNumber', validators.licenseNumber)} />
          <Input label="Years of experience" type="number" placeholder="5" required error={errors.experience?.message}
            {...register('experience', validators.experience)} />
        </div>
        <Input label="Consultation fee (₹)" type="number" placeholder="500" error={errors.consultationFee?.message}
          {...register('consultationFee', validators.positiveNumber)} />
        <TextArea label="Professional bio" placeholder="Tell patients about your background, expertise, and approach..."
          rows={3} error={errors.bio?.message}
          {...register('bio', validators.textArea(20, 500))} />
        <PasswordInput
          label="Password" placeholder="••••••••" required showStrength value={passwordValue}
          error={errors.password?.message}
          {...register('password', validators.password)}
        />
        <PasswordInput
          label="Confirm password" placeholder="••••••••" required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', validators.confirmPassword(getValues))}
        />
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
          Your registration will be reviewed by our admin team. You'll receive an email notification once approved.
        </div>
        <Button type="submit" loading={loading} disabled={!mobileVerified} className="w-full">Submit for review</Button>
      </form>
    </AuthFormWrapper>
  )
}

// ── Hospital Registration ──────────────────────────────────────────────────────
export function HospitalRegisterPage() {
  const { register: registerUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [mobileVerified, setMobileVerified] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors }, watch } = useForm()
  const passwordValue = watch('password', '')
  const phoneValue = watch('phone', '')

  const onSubmit = async (data) => {
    if (!mobileVerified) {
      toast.error('Please verify your mobile number before submitting.')
      return
    }

    setLoading(true)
    setServerError('')
    try {
      await registerUser({ ...data, role: 'hospital' }, 'hospital')
    } catch (err) {
      setServerError(parseServerError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormWrapper title="Register your facility" subtitle="Register your hospital or clinic on MedConnect">
      {serverError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Facility name" placeholder="City General Hospital" required error={errors.name?.message}
          {...register('name', { required: 'Facility name is required', minLength: { value: 3, message: 'Too short' } })} />
        <Input label="Contact email" type="email" placeholder="admin@hospital.com" required error={errors.email?.message}
          {...register('email', validators.email)} />
        
        <div>
          <div className="flex items-end gap-2 w-full">
            <div className="flex-1 min-w-0">
              <Input label="Contact phone" type="tel" placeholder="+91 9876543210" required error={errors.phone?.message}
                {...register('phone', validators.phone)} />
            </div>
            <div className="flex-shrink-0 mb-[1px]">
              <MobileOtpVerification
                phone={phoneValue}
                onVerifiedChange={setMobileVerified}
                disabled={loading}
              />
            </div>
          </div>
          {mobileVerified && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Mobile number verified successfully.
            </p>
          )}
        </div>

        <Input label="Website" type="url" placeholder="https://hospital.com" error={errors.website?.message}
          {...register('website', validators.url)} />
        <TextArea label="Address" placeholder="123 Medical Drive, City, State, ZIP" required rows={2}
          error={errors.address?.message}
          {...register('address', { required: 'Address is required' })} />
        <Input label="City" placeholder="New York" required error={errors.city?.message}
          {...register('city', { required: 'City is required' })} />
        <TextArea label="About the facility" placeholder="Describe your hospital's specialties, services, and facilities..."
          rows={3} error={errors.about?.message}
          {...register('about', validators.textArea(20, 500))} />
        <PasswordInput
          label="Password" placeholder="••••••••" required showStrength value={passwordValue}
          error={errors.password?.message}
          {...register('password', validators.password)}
        />
        <PasswordInput
          label="Confirm password" placeholder="••••••••" required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', validators.confirmPassword(getValues))}
        />
        <Button type="submit" loading={loading} disabled={!mobileVerified} className="w-full">Submit for review</Button>
      </form>
    </AuthFormWrapper>
  )
}

// ── Forgot Password ────────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormWrapper title="Reset your password" subtitle="We'll send a reset link to your email">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Check your inbox</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A password reset link has been sent. It expires in 1 hour.
          </p>
          <Link to="/login" className="btn btn-primary mt-5 inline-flex">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email address" type="email" placeholder="you@example.com" required
            error={errors.email?.message}
            {...register('email', validators.email)}
          />
          <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthFormWrapper>
  )
}
