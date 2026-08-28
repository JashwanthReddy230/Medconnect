import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  UsersIcon, BuildingOffice2Icon, CalendarIcon,
  StarIcon, ArrowRightIcon, PlusIcon,
  CheckCircleIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { hospitalService, appointmentService } from '@/api/services'
import { StatCard, Avatar, Badge, EmptyState } from '@/components/common/index.jsx'
import { normalizeDoctors } from '@/utils/normalizers'
import { tokenManager } from '@/utils/tokenManager'
import clsx from 'clsx'

import { reviewService } from '@/api/services'
import ReviewModal from '@/components/common/ReviewModal.jsx'

export default function HospitalDashboard() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [apptCount, setApptCount] = useState(0)
  const [loading,   setLoading]   = useState(true)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  // Check eligibility for website review (once per month)
  useEffect(() => {
    if (!user?.id) return
    reviewService.checkEligibility(user.id, 'HOSPITAL', 'MEDCONNECT', null)
      .then((res) => {
        if (res.data?.eligible) {
          setReviewModalOpen(true)
        }
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    const profile = tokenManager.loadProfile() || {}
    const hospitalId = profile.id || user?.id
    if (!hospitalId) { setLoading(false); return }

    Promise.allSettled([
      hospitalService.getDoctors(hospitalId),
      appointmentService.getHospitalAppointments(hospitalId),
    ]).then(([docRes, apptRes]) => {
      if (cancelled) return
      if (docRes.status === 'fulfilled') {
        setDoctors(normalizeDoctors(docRes.value.data || []))
      }
      if (apptRes.status === 'fulfilled') {
        setApptCount((apptRes.value.data || []).length)
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{user?.fullName || 'Hospital'} 🏥</h1>
          <p className="page-sub">Manage your facility, doctors, and departments.</p>
        </div>
        <Link to="/hospital/profile" className="btn btn-primary btn-sm self-start sm:self-auto">
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Doctors"  value={loading ? '…' : doctors.length}   icon={<UsersIcon />}           color="primary" />
        <StatCard title="Active Doctors" value={loading ? '…' : doctors.filter(d => d.status === 'ACTIVE').length} icon={<CheckCircleIcon />} color="info"    />
        <StatCard title="Appointments"   value={loading ? '…' : apptCount}          icon={<CalendarIcon />}         color="success" />
        <StatCard title="Avg Rating"     value="4.8★"                               icon={<StarIcon />}             color="warning" />
      </div>

      {/* Hospital Management Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link to="/hospital/doctors" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UsersIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Doctors</p>
            <p className="text-[10px] text-slate-400">Manage staff</p>
          </div>
        </Link>
        <Link to="/hospital/patients" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <UsersIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Patients</p>
            <p className="text-[10px] text-slate-400">Directory & info</p>
          </div>
        </Link>
        <Link to="/hospital/appointments" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Appointments</p>
            <p className="text-[10px] text-slate-400">Confirm/Cancel</p>
          </div>
        </Link>
        <Link to="/hospital/transactions" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <StarIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Bills & Fees</p>
            <p className="text-[10px] text-slate-400">Billing audit</p>
          </div>
        </Link>
        <Link to="/hospital/transactions" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <CheckCircleIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Payments</p>
            <p className="text-[10px] text-slate-400">Transactions</p>
          </div>
        </Link>
        <Link to="/hospital/transactions" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <BuildingOffice2Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Invoices</p>
            <p className="text-[10px] text-slate-400">Statements</p>
          </div>
        </Link>
        <Link to="/hospital/reports" className="card p-3 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Reports</p>
            <p className="text-[10px] text-slate-400">Analytics</p>
          </div>
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Affiliated Doctors */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Affiliated Doctors</h2>
            <div className="flex items-center gap-2">
              <Link to="/hospital/doctors" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View all <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/3" />
                    <div className="h-2 bg-slate-300 dark:bg-slate-600 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="w-7 h-7" />}
              title="No affiliated doctors"
              description="Doctors registered under your hospital will appear here."
            />
          ) : (
          <div className="space-y-3">
            {doctors.slice(0, 5).map((doc) => (
              <div key={doc._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark">
                <div className="flex items-center gap-3">
                  <Avatar name={doc.fullName} size="md" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{doc.specialization || '—'}</p>
                    {doc.consultationFee != null && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">₹{doc.consultationFee}</p>
                    )}
                  </div>
                </div>
                <span className={clsx(
                  'badge text-xs',
                  doc.status === 'ACTIVE'   ? 'badge-success' : 'badge-warning'
                )}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
          )}

          <Link to="/hospital/doctors" className="btn btn-secondary btn-sm mt-4 gap-2">
            <PlusIcon className="w-4 h-4" />
            Add doctor
          </Link>
        </div>

        {/* Departments + Quick info */}
        <div className="space-y-5">
          {/* Hospital info card */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Facility info</h2>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm">
                  {user?.address || 'Main Street'}
                  {user?.city ? `, ${user.city}` : ''}
                  {!user?.address && !user?.city ? 'Address not specified' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm">{user?.phone || user?.mobile || 'Phone not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Verified facility</span>
              </div>
            </div>
            <Link to="/hospital/profile" className="btn btn-secondary btn-sm mt-3">
              Edit details
            </Link>
          </div>

          {/* Departments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Departments</h2>
              <Link to="/hospital/departments" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {doctors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No doctors affiliated yet.</p>
              ) : (
                [...new Set(doctors.map(d => d.specialization).filter(Boolean))].slice(0, 6).map((spec) => (
                  <div key={spec} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">{spec}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {doctors.filter(d => d.specialization === spec).length} doctor{doctors.filter(d => d.specialization === spec).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link to="/hospital/departments" className="btn btn-secondary btn-sm mt-3 gap-2">
              <PlusIcon className="w-4 h-4" />
              Add department
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Manage departments', to: '/hospital/departments', icon: BuildingOffice2Icon },
          { label: 'View all doctors',   to: '/hospital/doctors',     icon: UsersIcon },
          { label: 'Record access audit', to: '/hospital/audit',       icon: ShieldCheckIcon },
          { label: 'Edit facility info', to: '/hospital/profile',     icon: BuildingOffice2Icon },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className="card-hover p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
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
        reviewerRole="HOSPITAL"
      />
    </div>
  )
}
