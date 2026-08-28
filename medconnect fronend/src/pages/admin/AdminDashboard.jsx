import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  UsersIcon, UserIcon, BuildingOffice2Icon, CalendarIcon,
  ShieldCheckIcon, StarIcon, ArrowRightIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { adminService, doctorService } from '@/api/services'
import { StatCard, Avatar, Badge, CardSkeleton } from '@/components/common/index.jsx'
import { formatRelative, formatDateTime, doctorApprovalMap } from '@/utils/formatters'
import { normalizeDoctors } from '@/utils/normalizers'
import Button from '@/components/common/Button.jsx'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats,          setStats]         = useState({})
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [approving,      setApproving]      = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.allSettled([
      adminService.getDashboardStats(),
      doctorService.getAll(),
    ]).then(([statsRes, doctorsRes]) => {
      if (cancelled) return
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || {})
      }
      if (doctorsRes.status === 'fulfilled') {
        const all = normalizeDoctors(doctorsRes.value.data || [])
        // Pending = status is not ACTIVE (could be INACTIVE, PENDING etc.)
        const pending = all.filter(d => d.status !== 'ACTIVE')
        setPendingDoctors(pending)
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleApprove = async (doctorId) => {
    setApproving((prev) => ({ ...prev, [doctorId]: 'approving' }))
    try {
      await doctorService.approve(doctorId)
      setApproving((prev) => ({ ...prev, [doctorId]: 'approved' }))
      setPendingDoctors(prev => prev.filter(d => String(d.id) !== String(doctorId)))
      toast.success('Doctor approved successfully.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve.')
      setApproving((prev) => ({ ...prev, [doctorId]: null }))
    }
  }

  const handleReject = async (doctorId) => {
    setApproving((prev) => ({ ...prev, [doctorId]: 'rejecting' }))
    try {
      await doctorService.reject(doctorId, 'Does not meet requirements')
      setApproving((prev) => ({ ...prev, [doctorId]: 'rejected' }))
      setPendingDoctors(prev => prev.filter(d => String(d.id) !== String(doctorId)))
      toast.success('Doctor rejected.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject.')
      setApproving((prev) => ({ ...prev, [doctorId]: null }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">Platform overview and management console</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Doctors"
          value={loading ? '…' : (stats.totalDoctors ?? 0).toLocaleString()}
          icon={<UserIcon />}
          color="primary"
        />
        <StatCard
          title="Total Patients"
          value={loading ? '…' : (stats.totalPatients ?? 0).toLocaleString()}
          icon={<UsersIcon />}
          color="info"
        />
        <StatCard
          title="Hospitals"
          value={loading ? '…' : (stats.totalHospitals ?? 0).toLocaleString()}
          icon={<BuildingOffice2Icon />}
          color="success"
        />
        <StatCard
          title="Today's Appts"
          value={loading ? '…' : (stats.todayAppointments ?? 0)}
          icon={<CalendarIcon />}
          color="warning"
        />
        <StatCard
          title="Pending Reviews"
          value={loading ? '…' : (stats.pendingDoctors ?? 0)}
          icon={<ClockIcon />}
          color="warning"
          dot={stats.pendingDoctors > 0}
        />
        <StatCard
          title="Total Appointments"
          value={loading ? '…' : (stats.totalAppointments ?? 0).toLocaleString()}
          icon={<CalendarIcon />}
          color="primary"
        />
        <StatCard
          title="Pending Hospitals"
          value={loading ? '…' : (stats.pendingHospitals ?? 0)}
          icon={<BuildingOffice2Icon />}
          color="info"
        />
        <StatCard
          title="Avg Rating"
          value="4.7★"
          icon={<StarIcon />}
          color="warning"
        />
      </div>

      {/* Activity placeholder + Pending doctors */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Placeholder chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Platform Summary</h2>
          </div>
          {loading ? (
            <div className="h-52 animate-pulse bg-muted-light dark:bg-muted-dark rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { label: 'Doctors',    count: stats.totalDoctors    || 0 },
                  { label: 'Patients',   count: stats.totalPatients   || 0 },
                  { label: 'Hospitals',  count: stats.totalHospitals  || 0 },
                  { label: 'Appts',      count: stats.totalAppointments || 0 },
                ]}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg, white)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Count" fill="#00897b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick stats sidebar */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick overview</h2>
          <div className="space-y-4">
            {[
              { label: 'Active doctors',    value: loading ? '…' : (stats.totalDoctors ?? 0) - (stats.pendingDoctors ?? 0),  color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Pending approval',  value: loading ? '…' : (stats.pendingDoctors ?? 0),    color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Active hospitals',  value: loading ? '…' : (stats.totalHospitals ?? 0) - (stats.pendingHospitals ?? 0), color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Total registered',  value: loading ? '…' : ((stats.totalPatients ?? 0) + (stats.totalDoctors ?? 0) + (stats.totalHospitals ?? 0)).toLocaleString(), color: 'text-primary-600 dark:text-primary-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                <span className={clsx('text-lg font-bold', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending doctor approvals */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Pending doctor approvals</h2>
            {!loading && pendingDoctors.length > 0 && (
              <span className="badge-warning">{pendingDoctors.length} pending</span>
            )}
          </div>
          <Link to="/admin/doctors/pending" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            View all <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted-light dark:bg-muted-dark rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pendingDoctors.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-muted-light dark:bg-muted-dark text-sm text-slate-500 dark:text-slate-400">
            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            No pending approvals — all doctors are active.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDoctors.slice(0, 5).map((doc) => {
                  const state = approving[doc.id]
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={doc.fullName} size="sm" />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{doc.specialization || '—'}</span>
                      </td>
                      <td>
                        <span className="badge-warning capitalize">{doc.status}</span>
                      </td>
                      <td>
                        {state === 'approved' ? (
                          <span className="badge-success">Approved</span>
                        ) : state === 'rejected' ? (
                          <span className="badge-danger">Rejected</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              loading={state === 'approving'}
                              onClick={() => handleApprove(doc.id)}
                              icon={<CheckCircleIcon className="w-3.5 h-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={state === 'rejecting'}
                              onClick={() => handleReject(doc.id)}
                              icon={<XCircleIcon className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Manage users',      to: '/admin/users',            icon: UsersIcon,          color: 'primary' },
          { label: 'All doctors',       to: '/admin/doctors',          icon: UserIcon,           color: 'info'    },
          { label: 'All hospitals',     to: '/admin/hospitals',        icon: BuildingOffice2Icon, color: 'success' },
          { label: 'All appointments',  to: '/admin/appointments',     icon: CalendarIcon,        color: 'warning' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="card-hover p-4 flex items-center gap-3"
            >
              <div className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                item.color === 'primary' && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                item.color === 'info'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                item.color === 'success' && 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                item.color === 'warning' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
              <ArrowRightIcon className="w-4 h-4 text-slate-400 ml-auto" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
