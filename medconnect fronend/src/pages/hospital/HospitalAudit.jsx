import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon, MagnifyingGlassIcon, ArrowPathIcon,
  ClockIcon, BuildingOffice2Icon, CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { auditService } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { tokenManager } from '@/utils/tokenManager'
import { Avatar, EmptyState, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import toast from 'react-hot-toast'

export default function HospitalAudit() {
  const { user } = useAuth()
  const [log,     setLog]     = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  const profile = tokenManager.loadProfile() || {}
  const hospitalId = profile.id || user?.id

  const fetchLog = async () => {
    setLoading(true)
    try {
      const res = await auditService.getHospitalAuditLog(hospitalId)
      setLog(res.data || [])
    } catch {
      toast.error('Failed to load audit log.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLog()
  }, [hospitalId])

  const filtered = log.filter(entry => {
    if (!debouncedQ) return true
    const q = debouncedQ.toLowerCase()
    return (
      (entry.doctorName || '').toLowerCase().includes(q) ||
      (entry.patientName || '').toLowerCase().includes(q) ||
      (entry.hospitalName || '').toLowerCase().includes(q) ||
      String(entry.doctorId || '').includes(q) ||
      String(entry.patientId || '').includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Medical Record Access Audit</h1>
          <p className="page-sub">
            Track every doctor–patient record access event within your facility
          </p>
        </div>
        <button
          onClick={fetchLog}
          className="btn btn-secondary btn-sm gap-2 self-start"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
            {loading ? '…' : log.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Access Events</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {loading ? '…' : new Set(log.map(e => e.doctorId)).size}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unique Doctors</p>
        </div>
        <div className="card p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {loading ? '…' : new Set(log.map(e => e.patientId)).size}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unique Patients Accessed</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-l-4 border-l-blue-400 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            HIPAA-Compliant Access Logging
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Each entry records when a doctor viewed a patient's medical record.
            Access is automatically logged when a doctor opens a patient profile in the system.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); goTo(1) }}
            placeholder="Search by doctor name, patient name, or ID…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 h-14 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="w-8 h-8" />}
          title={log.length === 0 ? 'No access events recorded yet' : 'No results match your search'}
          description={
            log.length === 0
              ? 'Events are automatically logged when a doctor views a patient medical record.'
              : 'Try a different search term.'
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Doctor</th>
                  <th>Patient</th>
                  <th>Hospital</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry) => (
                  <tr key={entry.id}>
                    {/* Audit ID */}
                    <td>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {entry.id?.split('-').slice(0, 2).join('-') || '—'}
                      </span>
                    </td>

                    {/* Doctor */}
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={entry.doctorName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {entry.doctorName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">DOC-{entry.doctorId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={entry.patientName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {entry.patientName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">PAT-{entry.patientId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Hospital */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <BuildingOffice2Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                          {entry.hospitalName || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                        {entry.date || new Date(entry.accessedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>

                    {/* Time */}
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        {entry.time || new Date(entry.accessedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      )}
    </div>
  )
}
