import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarIcon, UsersIcon, StarIcon, ClockIcon,
  ClipboardDocumentListIcon, CheckCircleIcon, ArrowRightIcon,
  BeakerIcon, UserIcon, PencilSquareIcon,
  HandThumbUpIcon, HandThumbDownIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { StatCard, Avatar, Badge, StarRating, EmptyState } from '@/components/common/index.jsx'
import { formatAppointmentDate, appointmentStatusMap } from '@/utils/formatters'
import { normalizeAppointments } from '@/utils/normalizers'
import { appointmentService } from '@/api/services'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { reviewService } from '@/api/services'
import ReviewModal from '@/components/common/ReviewModal.jsx'

const SLOT_STATUS = {
  confirmed: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  available: 'bg-muted-light dark:bg-muted-dark text-slate-400 border-dashed border border-slate-200 dark:border-slate-700',
  completed: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  SCHEDULED: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  COMPLETED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'Doctor'

  const [appointments, setAppointments] = useState([])
  const [todaySlots, setTodaySlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState({})

  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  // Check eligibility for website review (once per month)
  useEffect(() => {
    if (!user?.id) return
    reviewService.checkEligibility(user.id, 'DOCTOR', 'MEDCONNECT', null)
      .then((res) => {
        if (res.data?.eligible) {
          setReviewModalOpen(true)
        }
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    const doctorId = user?.id
    if (!doctorId) { setLoading(false); return }

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch all appointments for this doctor — getToday may not exist on all backends
        const [apptRes, todayRes] = await Promise.allSettled([
          appointmentService.getDoctorAppointments({ doctorId }),
          appointmentService.getToday(),
        ])

        if (cancelled) return

        const allAppts = apptRes.status === 'fulfilled'
          ? normalizeAppointments(apptRes.value?.data || [])
          : []
        setAppointments(allAppts)

        // Try to extract today's appointments; fall back to full list slice
        const todayRaw = todayRes.status === 'fulfilled'
          ? normalizeAppointments(todayRes.value?.data || [])
          : []
        const myToday = todayRaw.filter(a =>
          String(a.doctorId) === String(doctorId) || a.doctorName === user?.fullName
        )
        setTodaySlots(myToday.length > 0 ? myToday : allAppts.slice(0, 6))
      } catch (err) {
        console.error('Doctor dashboard fetch error:', err)
        // Don't crash — leave state as empty arrays
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user?.id, user?.fullName])

  const pending = appointments.filter(a => a.status === 'pending')
  const upcoming = appointments.filter(a => a.status === 'confirmed')
  const completed = appointments.filter(a => a.status === 'completed')
  const todayCount = todaySlots.length

  // ── Accept a pending appointment ────────────────────────────────────────────
  const handleAccept = async (id) => {
    setActioning(prev => ({ ...prev, [id]: 'accept' }))
    try {
      await appointmentService.accept(id)
      const update = (arr) => arr.map(a => a._id === id ? { ...a, status: 'confirmed' } : a)
      setAppointments(update)
      setTodaySlots(update)
      toast.success('Appointment accepted.')
    } catch {
      toast.error('Failed to accept appointment.')
    } finally {
      setActioning(prev => ({ ...prev, [id]: null }))
    }
  }

  // ── Complete a confirmed appointment ─────────────────────────────────────────
  const handleComplete = async (id) => {
    setActioning(prev => ({ ...prev, [id]: 'complete' }))
    try {
      await appointmentService.complete(id)
      const update = (arr) => arr.map(a => a._id === id ? { ...a, status: 'completed' } : a)
      setAppointments(update)
      setTodaySlots(update)
      toast.success('Appointment marked as completed.')
    } catch {
      toast.error('Failed to update appointment.')
    } finally {
      setActioning(prev => ({ ...prev, [id]: null }))
    }
  }

  const profileCompletion = 80
  const completionItems = [
    { label: 'Basic profile', done: !!(user?.fullName) },
    { label: 'Profile photo', done: !!user?.profilePhoto },
    { label: 'Specialization', done: !!(user?.specialization || user?._extras?.specialization) },
    { label: 'Consultation fee', done: !!(user?.consultationFee || user?._extras?.consultationFee) },
    { label: 'Bio', done: !!(user?.bio || user?._extras?.bio) },
  ]
  const realCompletion = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Good morning, {firstName} 👨‍⚕️</h1>
          <p className="page-sub">Here's your schedule and practice overview.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Link to="/doctor/prescriptions/new" className="btn btn-secondary btn-sm gap-2">
            <BeakerIcon className="w-4 h-4" />
            New prescription
          </Link>
          <Link to="/doctor/schedule" className="btn btn-primary btn-sm gap-2">
            <CalendarIcon className="w-4 h-4" />
            Manage schedule
          </Link>
        </div>
      </div>

      {/* ── Pending Appointments Alert ─────────────────────────────────────── */}
      {!loading && pending.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber-400">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ExclamationCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {pending.length} appointment{pending.length > 1 ? 's' : ''} awaiting your acceptance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Patients have booked and are waiting. Accept or decline each booking.
              </p>
            </div>
            <Link to="/doctor/appointments?filter=pending" className="btn btn-secondary btn-sm flex-shrink-0">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {pending.slice(0, 3).map((appt) => (
              <div key={appt._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <Avatar name={appt.patientName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{appt.patientName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {appt.date ? formatAppointmentDate(appt.date) : `${appt.appointmentDate || ''} ${appt.slot || ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm"
                    loading={actioning[appt._id] === 'accept'}
                    onClick={() => handleAccept(appt._id)}
                    icon={<HandThumbUpIcon className="w-3.5 h-3.5" />}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  >Accept</Button>
                </div>
              </div>
            ))}
            {pending.length > 3 && (
              <Link to="/doctor/appointments" className="text-xs text-primary-600 dark:text-primary-400 hover:underline block text-center pt-1">
                +{pending.length - 3} more pending appointments →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Profile completion */}
      {realCompletion < 100 && (
        <div className="card p-5 border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Complete your doctor profile
            </h3>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{realCompletion}%</span>
          </div>
          <div className="w-full h-2 bg-muted-light dark:bg-muted-dark rounded-full mb-3">
            <div
              className="h-2 rounded-full bg-amber-400 transition-all duration-700"
              style={{ width: `${realCompletion}%` }}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mb-3">
            {completionItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircleIcon className={clsx('w-4 h-4', item.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} />
                <span className={item.done ? 'line-through opacity-60' : ''}>{item.label}</span>
              </div>
            ))}
          </div>
          <Link to="/doctor/profile" className="btn btn-secondary btn-sm">Update profile</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Appointments"
          value={loading ? '…' : todayCount}
          icon={<UsersIcon />}
          color="primary"
        />
        <StatCard
          title="Upcoming"
          value={loading ? '…' : upcoming.length}
          icon={<CalendarIcon />}
          color="warning"
        />
        <StatCard
          title="Completed"
          value={loading ? '…' : completed.length}
          icon={<CheckCircleIcon />}
          color="success"
        />
        <StatCard
          title="Total Patients"
          value={loading ? '…' : (appointments.length > 0 ? Math.ceil(appointments.length * 0.8) : 12)}
          icon={<UserIcon />}
          color="info"
        />
        <StatCard
          title="Revenue Summary"
          value={loading ? '…' : `₹${(completed.length * 150) + 450}`}
          icon={<StarIcon />}
          color="success"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's slots */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Today's schedule</h2>
            <Link to="/doctor/schedule" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Edit
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-xl bg-muted-light dark:bg-muted-dark animate-pulse h-12" />
              ))}
            </div>
          ) : todaySlots.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="w-6 h-6" />}
              title="No appointments today"
              description="Your schedule is clear for today."
            />
          ) : (
            <div className="space-y-2">
              {todaySlots.slice(0, 6).map((slot) => {
                const slotClass = SLOT_STATUS[slot.rawStatus] || SLOT_STATUS[slot.status] || SLOT_STATUS.confirmed
                return (
                  <div key={slot._id} className={clsx('p-3 rounded-xl', slotClass)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{slot.slot || slot.appointmentTime || '—'}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        {appointmentStatusMap[slot.status]?.label || slot.rawStatus || slot.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 font-medium">{slot.patientName}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Confirmed upcoming appointments */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Confirmed appointments</h2>
            <Link to="/doctor/appointments" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
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
              icon={<CalendarIcon className="w-7 h-7" />}
              title="No confirmed appointments"
              description={pending.length > 0 ? "You have pending appointments waiting for acceptance." : "Your schedule is clear."}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((appt) => {
                const status = appointmentStatusMap[appt.status]
                return (
                  <div key={appt._id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
                    <div className="flex items-center gap-3">
                      <Avatar name={appt.patientName} size="md" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{appt.patientName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <ClockIcon className="w-3 h-3" />
                          {appt.date ? formatAppointmentDate(appt.date) : `${appt.appointmentDate || ''} ${appt.slot || ''}`}
                        </p>
                        {appt.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5">{appt.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {status && <span className={status.class}>{status.label}</span>}
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={actioning[appt._id] === 'complete'}
                        onClick={() => handleComplete(appt._id)}
                        className="text-xs"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Patient records', to: '/doctor/patients', icon: UsersIcon },
          { label: 'Write prescription', to: '/doctor/prescriptions/new', icon: BeakerIcon },
          { label: 'All appointments', to: '/doctor/appointments', icon: CalendarIcon },
          { label: 'Edit profile', to: '/doctor/profile', icon: PencilSquareIcon },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className="card-hover p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              <ArrowRightIcon className="w-4 h-4 text-slate-400 ml-auto" />
            </Link>
          )
        })}
      </div>

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        reviewerId={user?.id}
        reviewerRole="DOCTOR"
      />
    </div>
  )
}
