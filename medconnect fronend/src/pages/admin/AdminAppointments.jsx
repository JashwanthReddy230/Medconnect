import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { appointmentService } from '@/api/services'
import { Avatar, Badge, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatDate, formatTime, appointmentStatusMap } from '@/utils/formatters'
import { normalizeAppointments } from '@/utils/normalizers'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '',          label: 'All statuses' },
  { value: 'confirmed', label: 'Confirmed'    },
  { value: 'pending',   label: 'Pending'      },
  { value: 'completed', label: 'Completed'    },
  { value: 'cancelled', label: 'Cancelled'    },
  { value: 'no_show',   label: 'No Show'      },
]

const DATE_OPTIONS = [
  { value: 'all',      label: 'All time'    },
  { value: 'today',    label: 'Today'       },
  { value: 'upcoming', label: 'Upcoming'    },
  { value: 'past',     label: 'Past'        },
]

export default function AdminAppointments() {
  const [query,      setQuery]      = useState('')
  const [status,     setStatus]     = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [appts,      setAppts]      = useState([])
  const [fetching,   setFetching]   = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    appointmentService.getAll()
      .then(res => {
        if (!cancelled) setAppts(normalizeAppointments(res.data || []))
      })
      .catch(() => toast.error('Failed to load appointments.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const now = new Date()

  const filtered = appts.filter((a) => {
    const matchQ   = !debouncedQ ||
      a.patientName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(debouncedQ.toLowerCase())
    const matchSt  = !status || a.status === status
    const apptDate = new Date(a.date)
    const matchDate =
      dateFilter === 'all'                  ? true :
      dateFilter === 'today'                ? apptDate.toDateString() === now.toDateString() :
      dateFilter === 'upcoming'             ? apptDate > now :
      dateFilter === 'past'                 ? apptDate < now : true
    return matchQ && matchSt && matchDate
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const counts = {
    total:     appts.length,
    today:     appts.filter(a => new Date(a.date).toDateString() === now.toDateString()).length,
    upcoming:  appts.filter(a => new Date(a.date) > now).length,
    completed: appts.filter(a => a.status === 'completed').length,
    cancelled: appts.filter(a => a.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">All Appointments</h1>
        <p className="page-sub">Monitor all patient–doctor appointments across the platform</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: counts.total,     color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Today',     value: counts.today,     color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Upcoming',  value: counts.upcoming,  color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed', value: counts.completed, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Cancelled', value: counts.cancelled, color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDateFilter(opt.value); goTo(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                dateFilter === opt.value
                  ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search by patient or doctor name…"
              className="input pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); goTo(1) }}
            className="input w-full sm:w-44"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((appt) => {
                const statusCfg = appointmentStatusMap[appt.status]
                const isPast    = new Date(appt.date) < now
                return (
                  <tr key={appt._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={appt.patientName} size="sm" />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {appt.patientName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {appt.doctorName}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {appt.specialty}
                      </span>
                    </td>
                    <td>
                      <span className={clsx(
                        'text-xs',
                        isPast
                          ? 'text-slate-400'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
                      )}>
                        {formatDate(appt.date)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {appt.slot}
                      </span>
                    </td>
                    <td>
                      <span className={statusCfg?.class}>{statusCfg?.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            No appointments match your filters.
          </div>
        )}

        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goTo}
            pageSize={limit}
            onPageSizeChange={changeLimit}
            total={filtered.length}
          />
        </div>
      </div>
    </div>
  )
}
