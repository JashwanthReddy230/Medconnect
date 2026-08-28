import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  UserIcon, CameraIcon, CheckCircleIcon, ClockIcon,
  PlusIcon, TrashIcon, StarIcon, MapPinIcon,
} from '@heroicons/react/24/outline'
import { doctorService } from '@/api/doctorService'
import { hospitalService } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { tokenManager } from '@/utils/tokenManager'
import { Input, Select, TextArea } from '@/components/common/FormFields.jsx'
import { Avatar, StarRating } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Neurologist','Orthopedic',
  'Pediatrician','Psychiatrist','Gynecologist','Oncologist','Urologist',
  'ENT Specialist','Ophthalmologist','Radiologist','Anesthesiologist','Dentist','Other',
].map(v => ({ value: v, label: v }))

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const TIMES = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM']

// Build the initial doctor profile from registration data stored in AuthContext
function buildInitialDoctor(user) {
  return {
    firstName:       user?.firstName       || user?.fullName?.split(' ')[0]              || '',
    lastName:        user?.lastName        || user?.fullName?.split(' ').slice(1).join(' ') || '',
    email:           user?.email           || '',
    phone:           user?.phone           || user?.mobile || '',
    specialization:  user?.specialization  || '',
    licenseNumber:   user?.licenseNumber   || '',
    experience:      user?.experience      || '',
    consultationFee: user?.consultationFee || '',
    city:            user?.city            || '',
    bio:             user?.bio             || '',
    availability: {
      Monday:    { enabled: true,  start: '9:00 AM', end: '5:00 PM', slotDuration: 30 },
      Tuesday:   { enabled: true,  start: '9:00 AM', end: '5:00 PM', slotDuration: 30 },
      Wednesday: { enabled: false, start: '9:00 AM', end: '1:00 PM', slotDuration: 30 },
      Thursday:  { enabled: true,  start: '9:00 AM', end: '5:00 PM', slotDuration: 30 },
      Friday:    { enabled: true,  start: '9:00 AM', end: '3:00 PM', slotDuration: 30 },
      Saturday:  { enabled: false, start: '9:00 AM', end: '1:00 PM', slotDuration: 30 },
      Sunday:    { enabled: false, start: '9:00 AM', end: '1:00 PM', slotDuration: 30 },
    },
    ratings: 0, reviewCount: 0,
  }
}

const TABS = ['Profile', 'Availability', 'Reviews']

export default function DoctorProfile() {
  const { user, updateUser } = useAuth()
  const [activeTab,    setActiveTab]    = useState(0)
  const [loading,      setLoading]      = useState(false)
  const doctorData = buildInitialDoctor(user)
  const [availability, setAvailability] = useState(doctorData.availability)
  const [languages,    setLanguages]    = useState([])
  const [newLang,      setNewLang]      = useState('')
  const [workingHospital, setWorkingHospital] = useState('')
  const fileRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: doctorData })

  useEffect(() => {
    const profileSnapshot = tokenManager.loadProfile() || {}
    const doctorId = profileSnapshot.id || user?.id
    if (doctorId) {
      doctorService.getProfile(doctorId)
        .then((res) => {
          const fetched = res.data || {}
          const mapped = {
            firstName:       fetched.doctorName?.split(' ')[0] || user?.firstName || profileSnapshot.firstName || '',
            lastName:        fetched.doctorName?.split(' ').slice(1).join(' ') || user?.lastName || profileSnapshot.lastName || '',
            email:           fetched.email || user?.email || profileSnapshot.email || '',
            phone:           fetched.mobile || fetched.phone || user?.phone || profileSnapshot.phone || '',
            specialization:  fetched.specialization || user?.specialization || profileSnapshot.specialization || '',
            licenseNumber:   fetched.licenseNumber || user?.licenseNumber || profileSnapshot.licenseNumber || '',
            experience:      fetched.experience != null ? fetched.experience : (user?.experience || profileSnapshot.experience || ''),
            consultationFee: fetched.consultationFee != null ? fetched.consultationFee : (user?.consultationFee || profileSnapshot.consultationFee || ''),
            city:            fetched.city || user?.city || profileSnapshot.city || '',
            bio:             fetched.bio || user?.bio || profileSnapshot.bio || '',
            availability:    fetched.availability || doctorData.availability
          }
          reset(mapped)
          if (fetched.languages) setLanguages(fetched.languages)
          if (fetched.availability) setAvailability(fetched.availability)

          // Resolve working hospital name from hospitalId
          const hid = fetched.hospitalId
          if (hid) {
            hospitalService.getById(hid)
              .then(hRes => {
                const h = hRes.data || {}
                setWorkingHospital(h.hospitalName || h.name || `Hospital #${hid}`)
              })
              .catch(() => setWorkingHospital(`Hospital #${hid}`))
          }
        })
        .catch(() => {
          reset(buildInitialDoctor(user))
        })
    } else {
      reset(buildInitialDoctor(user))
    }
  }, [user, reset])

  const onSaveProfile = async (data) => {
    setLoading(true)
    try {
      await doctorService.updateProfile({ ...data, languages })
      updateUser({
        fullName: `Dr. ${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        mobile: data.phone,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        experience: data.experience,
        consultationFee: data.consultationFee,
        city: data.city,
        bio: data.bio,
        _extras: {
          specialization: data.specialization,
          licenseNumber: data.licenseNumber,
          experience: data.experience,
          consultationFee: data.consultationFee,
          city: data.city,
          bio: data.bio,
        }
      })
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const onSaveAvailability = async () => {
    setLoading(true)
    try {
      await doctorService.updateAvailability(availability)
      toast.success('Availability updated!')
    } catch {
      toast.error('Failed to update availability.')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  const updateDayTime = (day, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const MOCK_REVIEWS = [
    { _id:'1', rating: 5, comment: 'Exceptional care. Very thorough and took time to explain everything.', createdAt: new Date(Date.now()-86400000).toISOString() },
    { _id:'2', rating: 5, comment: 'Best cardiologist I have been to. Highly recommend.', createdAt: new Date(Date.now()-172800000).toISOString() },
    { _id:'3', rating: 4, comment: 'Very knowledgeable. Wait time was a bit long but the consultation was worth it.', createdAt: new Date(Date.now()-259200000).toISOString() },
    { _id:'4', rating: 5, comment: 'Dr. Chen was patient and answered all my questions. Great experience.', createdAt: new Date(Date.now()-345600000).toISOString() },
  ]

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Manage your professional profile and availability</p>
      </div>

      {/* Profile header */}
      <div className="card p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div className="relative flex-shrink-0">
          <Avatar name={`${doctorData.firstName} ${doctorData.lastName}`} src={user?.profilePhoto} size="2xl" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              const fd = new FormData()
              fd.append('photo', file)
              try {
                await doctorService.uploadProfilePhoto(fd)
                const reader = new FileReader()
                reader.onloadend = () => {
                  updateUser({ profilePhoto: reader.result })
                }
                reader.readAsDataURL(file)
                toast.success('Photo updated!')
              } catch { toast.error('Upload failed.') }
            }}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {doctorData.firstName || doctorData.lastName
              ? `Dr. ${doctorData.firstName} ${doctorData.lastName}`.trim()
              : user?.fullName || 'Doctor'}
          </h2>
          <p className="text-primary-600 dark:text-primary-400 font-medium">{doctorData.specialization || 'Specialist'}</p>
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-2">
            {doctorData.ratings > 0 && <StarRating rating={doctorData.ratings} showValue size="sm" />}
            {doctorData.reviewCount > 0 && <span className="text-xs text-slate-400">({doctorData.reviewCount} reviews)</span>}
            {doctorData.city && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPinIcon className="w-3 h-3" />{doctorData.city}
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
            {doctorData.experience && <span className="badge-primary">{doctorData.experience} yrs exp</span>}
            <span className="badge-success">Verified</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === i
                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Profile ── */}
      {activeTab === 0 && (
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Professional details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" required error={errors.firstName?.message}
                {...register('firstName', validators.name)} />
              <Input label="Last name" required error={errors.lastName?.message}
                {...register('lastName', validators.name)} />
              <Input label="Email" type="email" required error={errors.email?.message}
                {...register('email', validators.email)} />
              <Input label="Phone" type="tel" required error={errors.phone?.message}
                {...register('phone', validators.phone)} />
              <Select label="Specialization" options={SPECIALIZATIONS} required
                error={errors.specialization?.message}
                {...register('specialization', { required: 'Required' })} />
              <Input label="License number" required error={errors.licenseNumber?.message}
                {...register('licenseNumber', validators.licenseNumber)} />
              <Input label="Years of experience" type="number" required
                error={errors.experience?.message}
                {...register('experience', validators.experience)} />
              <Input label="Consultation fee (₹)" type="number"
                {...register('consultationFee', validators.positiveNumber)} />
              <Input label="City" placeholder="New York" {...register('city')} />
              {workingHospital && (
                <div className="sm:col-span-2">
                  <label className="label">Working Hospital</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted-light dark:bg-muted-dark border border-border-light dark:border-border-dark">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{workingHospital}</span>
                    <span className="badge-success text-[11px]">Affiliated ✓</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Managed by hospital administration</p>
                </div>
              )}
            </div>
            <TextArea label="Professional bio" rows={4}
              error={errors.bio?.message}
              {...register('bio', validators.textArea(20, 600))} />

            {/* Languages */}
            <div>
              <label className="label">Languages spoken</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {languages.map((lang, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {lang}
                    <button type="button" onClick={() => setLanguages((l) => l.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  placeholder="Add language…"
                  className="input flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newLang.trim()) { setLanguages((l) => [...l, newLang.trim()]); setNewLang('') }
                    }
                  }}
                />
                <button type="button" onClick={() => { if (newLang.trim()) { setLanguages((l) => [...l, newLang.trim()]); setNewLang('') }}} className="btn btn-secondary btn-sm">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" loading={loading} icon={<CheckCircleIcon className="w-4 h-4" />}>
            Save profile
          </Button>
        </form>
      )}

      {/* ── Tab 1: Availability ── */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Weekly schedule</h2>
            <p className="text-xs text-slate-400 mb-4">Set your working hours for each day. Patients will be able to book within these times.</p>
            {DAYS.map((day) => {
              const cfg = availability[day]
              return (
                <div key={day} className={clsx(
                  'p-4 rounded-xl border transition-all',
                  cfg.enabled
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-border-light dark:border-border-dark bg-muted-light dark:bg-muted-dark'
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={clsx(
                          'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
                          cfg.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                        )}
                      >
                        <span className={clsx(
                          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          cfg.enabled && 'translate-x-5'
                        )} />
                      </button>
                      <span className={clsx(
                        'text-sm font-medium w-24',
                        cfg.enabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'
                      )}>
                        {day}
                      </span>
                    </div>
                    {cfg.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <select value={cfg.start} onChange={(e) => updateDayTime(day, 'start', e.target.value)} className="input py-1 text-xs flex-1">
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-xs text-slate-400">to</span>
                        <select value={cfg.end} onChange={(e) => updateDayTime(day, 'end', e.target.value)} className="input py-1 text-xs flex-1">
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={cfg.slotDuration} onChange={(e) => updateDayTime(day, 'slotDuration', Number(e.target.value))} className="input py-1 text-xs w-28">
                          {[15,20,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
                        </select>
                      </div>
                    )}
                    {!cfg.enabled && <span className="text-xs text-slate-400 italic">Day off</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <Button loading={loading} onClick={onSaveAvailability} icon={<CheckCircleIcon className="w-4 h-4" />}>
            Save availability
          </Button>
        </div>
      )}

      {/* ── Tab 2: Reviews ── */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-slate-800 dark:text-slate-100">{doctorData.ratings || '—'}</p>
                <StarRating rating={doctorData.ratings || 0} size="md" />
                <p className="text-xs text-slate-400 mt-1">{doctorData.reviewCount || 0} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map((star) => {
                  const count = MOCK_REVIEWS.filter(r => r.rating === star).length
                  const pct   = Math.round((count / MOCK_REVIEWS.length) * 100)
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right text-slate-500">{star}</span>
                      <StarIcon className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-1.5 bg-muted-light dark:bg-muted-dark rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-slate-400">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_REVIEWS.map((review) => (
              <div key={review._id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>
                <p className="text-xs text-slate-400">— Verified patient</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
