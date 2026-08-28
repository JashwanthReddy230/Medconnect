import { useState, useEffect } from 'react'
import {
  CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  CheckIcon, FunnelIcon, UserIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { appointmentService } from '@/api/services'
import { EmptyState, Badge, StatCard } from '@/components/common/index.jsx'
import { normalizeAppointments } from '@/utils/normalizers'
import { appointmentStatusMap, formatDate } from '@/utils/formatters'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function HospitalAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchAppts = async () => {
      setLoading(true)
      try {
        if (user?.id) {
          const res = await appointmentService.getHospitalAppointments(user.id)
          if (!cancelled) {
            setAppointments(normalizeAppointments(res.data || []))
          }
        }
      } catch (err) {
        console.error('Error fetching hospital appointments:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAppts()
    return () => { cancelled = true }
  }, [user?.id])

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      await appointmentService.updateStatus(id, newStatus)
      toast.success(`Appointment ${newStatus} successfully!`)
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a))
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = appointments.filter(a => statusFilter === 'all' || a.status === statusFilter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Hospital Appointment Management</h1>
        <p className="page-sub">Monitor, confirm, complete, or cancel appointments across hospital departments.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={appointments.length} icon={<CalendarIcon />} color="info" />
        <StatCard title="Pending Confirmation" value={appointments.filter(a => a.status === 'pending').length} icon={<ClockIcon />} color="warning" />
        <StatCard title="Confirmed / Upcoming" value={appointments.filter(a => a.status === 'confirmed').length} icon={<CheckCircleIcon />} color="primary" />
        <StatCard title="Completed Consultations" value={appointments.filter(a => a.status === 'completed').length} icon={<CheckIcon />} color="success" />
      </div>

      {/* Filter Tabs */}
      <div className="card p-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-primary-500 text-white dark:bg-primary-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="w-8 h-8" />}
            title="No appointments found"
            description="There are no appointments matching the selected filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Patient & ID</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map((a) => {
                  const statusInfo = appointmentStatusMap[a.status]
                  return (
                    <tr key={a._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {a.patientName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        Dr. {a.doctorName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {a.appointmentDate} · {a.slot || 'TBD'}
                      </td>
                      <td className="py-3 px-4">
                        {statusInfo && (
                          <span className={clsx('badge text-xs', statusInfo.class)}>{statusInfo.label}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {a.status === 'pending' && (
                            <Button
                              variant="primary"
                              size="xs"
                              loading={updatingId === a._id}
                              onClick={() => handleStatusChange(a._id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                          )}
                          {a.status === 'confirmed' && (
                            <Button
                              variant="secondary"
                              size="xs"
                              loading={updatingId === a._id}
                              onClick={() => handleStatusChange(a._id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {a.status !== 'cancelled' && a.status !== 'completed' && (
                            <Button
                              variant="danger"
                              size="xs"
                              loading={updatingId === a._id}
                              onClick={() => handleStatusChange(a._id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
