import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarIcon, ClockIcon, UserIcon, BellIcon,
  ClipboardDocumentListIcon, StarIcon, HeartIcon,
  ArrowRightIcon, CheckCircleIcon, InformationCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { appointmentService, patientService } from '@/api/services'
import {
  StatCard, Avatar, Badge, Skeleton, EmptyState, StarRating,
} from '@/components/common/index.jsx'
import { formatAppointmentDate, appointmentStatusMap } from '@/utils/formatters'
import { normalizeAppointments } from '@/utils/normalizers'
import Button from '@/components/common/Button.jsx'
import clsx from 'clsx'

const MEDICATION_TIPS = [
  { condition: 'Headache',   tip: 'Stay hydrated, rest in a dark room, and avoid screens.' },
  { condition: 'Cold & Flu', tip: 'Drink plenty of fluids, rest, and consider OTC decongestants.' },
  { condition: 'Fever',      tip: 'Monitor temperature, stay cool, and take acetaminophen if above 102°F.' },
  { condition: 'Allergies',  tip: 'Avoid known triggers, use antihistamines, and keep windows closed.' },
]

export default function PatientDashboard() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  const [appointments, setAppointments] = useState([])
  const [patientData,  setPatientData]  = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [currentTime,  setCurrentTime]  = useState(new Date())

  // Ticking live clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const patientId = user?.id

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch appointments for this patient
        if (patientId) {
          const apptRes = await appointmentService.getPatientAppointments(patientId)
          if (!cancelled) {
            setAppointments(normalizeAppointments(apptRes.data || []))
          }
        }
        // Fetch patient profile
        if (patientId) {
          try {
            const pRes = await patientService.getById(patientId)
            if (!cancelled) setPatientData(pRes.data)
          } catch { /* profile fetch optional */ }
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user?.id])

  const pending    = appointments.filter(a => a.status === 'pending')
  const upcoming   = appointments.filter(a => a.status === 'confirmed')
  const completed  = appointments.filter(a => a.status === 'completed')
  const cancelled  = appointments.filter(a => a.status === 'cancelled')

  // Profile completion check
  const completionItems = [
    { label: 'Basic information',  done: !!(patientData?.fullName || user?.fullName) },
    { label: 'Profile photo',      done: !!user?.profilePhoto },
    { label: 'Blood group',        done: !!(patientData?.bloodGroup) },
    { label: 'Emergency contact',  done: !!(patientData?.emergencyContact) },
  ]
  const profileCompletion = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Good morning, {firstName} 👋</h1>
          <p className="page-sub">Here's your health overview for today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link to="/patient/hospitals" className="btn btn-secondary btn-sm gap-2">
            <BuildingOfficeIcon className="w-4 h-4 text-primary-500" />
            Find Hospital
          </Link>
          <Link to="/patient/doctors" className="btn btn-primary btn-sm gap-2">
            <UserIcon className="w-4 h-4" />
            Find Doctor
          </Link>
          {/* Live Digital Clock Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 shadow-xs">
            <ClockIcon className="w-4 h-4 text-primary-500 animate-pulse flex-shrink-0" />
            <div className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
              <span className="text-[10px] text-slate-400 hidden md:inline font-sans">
                • {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Flow Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link to="/patient/hospitals" className="card p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <BuildingOfficeIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Hospitals</p>
            <p className="text-[10px] text-slate-400">Browse centers</p>
          </div>
        </Link>
        <Link to="/patient/doctors" className="card p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Doctors</p>
            <p className="text-[10px] text-slate-400">Search specialists</p>
          </div>
        </Link>
        <Link to="/patient/medical-history" className="card p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ClipboardDocumentListIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Records</p>
            <p className="text-[10px] text-slate-400">Medical History</p>
          </div>
        </Link>
        <Link to="/patient/prescriptions" className="card p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <HeartIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Prescriptions</p>
            <p className="text-[10px] text-slate-400">Rx details</p>
          </div>
        </Link>
        <Link to="/patient/bills" className="card p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <StarIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Bills & Invoices</p>
            <p className="text-[10px] text-slate-400">Payments & fees</p>
          </div>
        </Link>
      </div>

      {/* Profile completion */}
      {profileCompletion < 100 && (
        <div className="card p-5 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Complete your health profile
            </h3>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{profileCompletion}%</span>
          </div>
          <div className="w-full h-2 bg-muted-light dark:bg-muted-dark rounded-full mb-3">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all duration-700"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {completionItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircleIcon className={clsx('w-4 h-4', item.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} />
                <span className={item.done ? 'line-through opacity-60' : ''}>{item.label}</span>
              </div>
            ))}
          </div>
          <Link to="/patient/profile" className="btn btn-primary btn-sm mt-3">Complete profile</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Awaiting Acceptance"
          value={loading ? '…' : pending.length}
          icon={<CalendarIcon />}
          color="warning"
        />
        <StatCard
          title="Confirmed"
          value={loading ? '…' : upcoming.length}
          icon={<CheckCircleIcon />}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={loading ? '…' : completed.length}
          icon={<CheckCircleIcon />}
          color="success"
        />
        <StatCard
          title="Total"
          value={loading ? '…' : appointments.length}
          icon={<StarIcon />}
          color="info"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming appointments</h2>
            <Link to="/patient/appointments" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-muted-light dark:bg-muted-dark animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/3" />
                    <div className="h-2 bg-slate-300 dark:bg-slate-600 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="w-8 h-8" />}
              title="No upcoming appointments"
              description="Book an appointment with a doctor to get started."
              action={<Link to="/patient/doctors" className="btn btn-primary btn-sm">Find a doctor</Link>}
            />
          ) : (
            <div className="space-y-3">
              {/* Show pending first, then confirmed */}
              {[...pending, ...upcoming].slice(0, 3).map((appt) => {
                const status = appointmentStatusMap[appt.status]
                const isPending = appt.status === 'pending'
                return (
                  <div key={appt._id} className={clsx(
                    'flex items-start sm:items-center justify-between gap-3 p-4 rounded-xl',
                    isPending
                      ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30'
                      : 'bg-muted-light dark:bg-muted-dark'
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar name={appt.doctorName} size="md" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{appt.doctorName}</p>
                        {appt.specialty && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{appt.specialty}</p>
                        )}
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {appt.date ? formatAppointmentDate(appt.date) : `${appt.appointmentDate || ''} ${appt.slot || ''}`}
                        </p>
                        {isPending && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <InformationCircleIcon className="w-3 h-3" />
                            Waiting for doctor acceptance
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {status && <span className={status.class}>{status.label}</span>}
                      <Link
                        to="/patient/appointments"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick links / health tips */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Book an appointment', to: '/patient/doctors', color: 'primary' },
              { label: 'View all appointments', to: '/patient/appointments', color: 'info' },
              { label: 'My profile', to: '/patient/profile', color: 'success' },
              { label: 'Notifications', to: '/patient/notifications', color: 'warning' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted-light dark:hover:bg-muted-dark transition-colors group"
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Basic medication guide */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <HeartIcon className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Basic care guide</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          General information only — always consult a doctor for medical advice.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {MEDICATION_TIPS.map((item) => (
            <div key={item.condition} className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{item.condition}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
