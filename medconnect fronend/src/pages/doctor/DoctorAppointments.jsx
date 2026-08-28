import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarIcon, ClockIcon, MagnifyingGlassIcon,
  CheckCircleIcon, XCircleIcon, EyeIcon,
  HandThumbUpIcon, HandThumbDownIcon, ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { appointmentService } from '@/api/services'
import { Avatar, Badge, Pagination, EmptyState, Modal } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatAppointmentDate, formatDate, appointmentStatusMap } from '@/utils/formatters'

import { useAuth } from '@/context/AuthContext'
import TreatmentWorkflowModal from '@/components/doctor/TreatmentWorkflowModal.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled']

// The API doesn't consistently return the same id field for every appointment
// (some records use `_id`, others `id`) — always resolve through this helper
// instead of reading `.` _id` or `.id` directly, so accept/reject/etc. never
// fire with an `undefined` id.
const getApptId = (appt) => appt?._id || appt?.id

export default function DoctorAppointments() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false)
  const [treatmentAppt, setTreatmentAppt] = useState(null)

  const [loading, setLoading] = useState({})
  const [appts, setAppts] = useState([])
  const [fetching, setFetching] = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 6)

  useEffect(() => {
    let cancelled = false
    const doctorId = user?.id
    if (!doctorId) { setFetching(false); return }
    setFetching(true)
    appointmentService.getDoctorAppointments({ doctorId })
      .then(res => {
        if (!cancelled) setAppts(res.data || [])
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load appointments.')
      })
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [user?.id])


  const filtered = appts.filter((a) => {
    const matchQ = !debouncedQ ||
      a.patientName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (a.appointmentNumber || '').toLowerCase().includes(debouncedQ.toLowerCase())
    const matchF = filter === 'all' || a.status === filter
    return matchQ && matchF
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const updateStatus = (id, status) => {
    setAppts((prev) => prev.map((a) => getApptId(a) === id ? { ...a, status } : a))
    if (getApptId(selected) === id) setSelected(prev => prev ? { ...prev, status } : prev)
  }

  // ── Accept (pending → confirmed) ──────────────────────────────────────────
  const handleAccept = async (id) => {
    if (!id) { toast.error('Missing appointment id — cannot accept.'); return }
    setLoading((p) => ({ ...p, [id]: 'accept' }))
    try {
      await appointmentService.accept(id)
      updateStatus(id, 'confirmed')
      toast.success('Appointment accepted! Patient has been notified.')
      setViewOpen(false)
    } catch { toast.error('Failed to accept appointment.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  // ── Reject (pending → cancelled) ──────────────────────────────────────────
  const handleReject = async (id) => {
    if (!id) { toast.error('Missing appointment id — cannot decline.'); return }
    setLoading((p) => ({ ...p, [id]: 'reject' }))
    try {
      await appointmentService.cancel(id, 'Doctor declined appointment')
      updateStatus(id, 'cancelled')
      toast.success('Appointment declined.')
      setViewOpen(false)
    } catch { toast.error('Failed to decline appointment.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  // ── Complete (confirmed → completed) ─────────────────────────────────────
  const handleComplete = async (id) => {
    if (!id) { toast.error('Missing appointment id — cannot complete.'); return }
    setLoading((p) => ({ ...p, [id]: 'complete' }))
    try {
      await appointmentService.complete(id)
      updateStatus(id, 'completed')
      toast.success('Appointment marked as completed.')
      setViewOpen(false)
    } catch { toast.error('Failed to update.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  // ── Cancel (confirmed → cancelled) ───────────────────────────────────────
  const handleCancel = async (id) => {
    if (!id) { toast.error('Missing appointment id — cannot cancel.'); return }
    setLoading((p) => ({ ...p, [id]: 'cancel' }))
    try {
      await appointmentService.cancel(id, 'Doctor cancelled')
      updateStatus(id, 'cancelled')
      toast.success('Appointment cancelled.')
      setViewOpen(false)
    } catch { toast.error('Failed to cancel.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  const openView = (appt) => { setSelected(appt); setViewOpen(true) }

  const openTreatmentWorkflow = (appt) => {
    setTreatmentAppt(appt)
    setTreatmentModalOpen(true)
  }



  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? appts.length : appts.filter((a) => a.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Appointments</h1>
        <p className="page-sub">Review, accept, and manage patient consultations</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting Acceptance', count: counts.pending, color: 'warning' },
          { label: 'Confirmed', count: counts.confirmed, color: 'primary' },
          { label: 'Completed', count: counts.completed, color: 'success' },
          { label: 'Cancelled', count: counts.cancelled, color: 'danger' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={clsx(
              'text-2xl font-bold',
              color === 'primary' && 'text-primary-600 dark:text-primary-400',
              color === 'warning' && 'text-amber-600 dark:text-amber-400',
              color === 'success' && 'text-emerald-600 dark:text-emerald-400',
              color === 'danger' && 'text-red-600 dark:text-red-400',
            )}>{count}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending notice banner */}
      {counts.pending > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {counts.pending} appointment{counts.pending > 1 ? 's' : ''} awaiting your acceptance
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Patients are waiting. Please accept or decline to confirm their bookings.
            </p>
          </div>
          <button
            onClick={() => { setFilter('pending'); goTo(1) }}
            className="btn btn-secondary btn-sm whitespace-nowrap flex-shrink-0"
          >
            View pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => { setFilter(s); goTo(1) }}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all',
                filter === s
                  ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {s === 'pending' ? 'Pending' : s}{' '}
              {counts[s] > 0 && <span className="ml-1 opacity-60">({counts[s]})</span>}
            </button>
          ))}
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); goTo(1) }}
            placeholder="Search by patient name or appointment ID…" className="input pl-9" />
        </div>
      </div>

      {/* Table */}
      {fetching ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState icon={<CalendarIcon className="w-8 h-8" />} title="No appointments found" description="Try changing your filter or search." />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date &amp; Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((appt) => {
                    const statusCfg = appointmentStatusMap[appt.status]
                    const isPending = appt.status === 'pending'
                    const isConfirmed = appt.status === 'confirmed'
                    const apptId = getApptId(appt)

                    return (
                      <tr key={apptId} className={clsx(isPending && 'bg-amber-50/40 dark:bg-amber-900/10')}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={appt.patientName} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{appt.patientName}</p>
                              <p className="text-xs text-slate-400">{appt.appointmentNumber || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            <p className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{formatDate(appt.date)}</p>
                            <p className="flex items-center gap-1 mt-0.5"><ClockIcon className="w-3 h-3" />{appt.slot}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{appt.notes || '—'}</p>
                        </td>
                        <td>
                          <span className={statusCfg?.class}>{statusCfg?.label}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => openView(appt)} className="btn btn-secondary btn-sm gap-1 text-xs">
                              <EyeIcon className="w-3.5 h-3.5" /> View
                            </button>

                            {/* PENDING: Accept / Reject */}
                            {isPending && (
                              <>
                                <Button size="sm" variant="primary"
                                  loading={loading[apptId] === 'accept'}
                                  onClick={() => handleAccept(apptId)}
                                  icon={<HandThumbUpIcon className="w-3.5 h-3.5" />}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                                >Accept</Button>
                                <Button size="sm" variant="danger"
                                  loading={loading[apptId] === 'reject'}
                                  onClick={() => handleReject(apptId)}
                                  icon={<HandThumbDownIcon className="w-3.5 h-3.5" />}
                                  className="text-xs"
                                >Decline</Button>
                              </>
                            )}

                            {/* CONFIRMED: Create Medical Record & Prescription / Cancel */}
                            {isConfirmed && (
                              <>
                                <Button size="sm" variant="primary"
                                  onClick={() => openTreatmentWorkflow(appt)}
                                  icon={<ClipboardDocumentListIcon className="w-3.5 h-3.5" />}
                                  className="text-xs bg-primary-600 hover:bg-primary-700"
                                >Create Medical Record &amp; Prescription</Button>
                                <Button size="sm" variant="danger"
                                  loading={loading[apptId] === 'cancel'}
                                  onClick={() => handleCancel(apptId)}
                                  icon={<XCircleIcon className="w-3.5 h-3.5" />}
                                  className="text-xs"
                                >Cancel</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={goTo} pageSize={limit} onPageSizeChange={changeLimit} total={filtered.length} />
            </div>
          </div>
        </>
      )}

      {/* View / Detail Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Appointment Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.patientName} size="lg" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{selected.patientName}</h3>
                <p className="text-xs text-slate-400">{selected.appointmentNumber || getApptId(selected)}</p>
                <span className={clsx('badge mt-1', appointmentStatusMap[selected.status]?.class)}>
                  {appointmentStatusMap[selected.status]?.label}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Appointment Ref', selected.appointmentNumber || getApptId(selected)],
                ['Date', formatDate(selected.date)],
                ['Time', selected.slot],
                ['Reason', selected.notes || selected.reason || '—'],
                ['Doctor Remarks', selected.remarks || '—'],
              ].map(([label, value]) => (
                <div key={label} className={label === 'Reason' || label === 'Doctor Remarks' ? 'col-span-2' : ''}>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>

            {/* Action buttons based on current status */}
            <div className="pt-2 space-y-3">
              {selected.status === 'pending' && (
                <>
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    ⏳ This patient is waiting for your acceptance. Please accept or decline their booking.
                  </p>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      loading={loading[getApptId(selected)] === 'accept'}
                      onClick={() => handleAccept(getApptId(selected))}
                      icon={<HandThumbUpIcon className="w-4 h-4" />}
                    >Accept Appointment</Button>
                    <Button className="flex-1" variant="danger"
                      loading={loading[getApptId(selected)] === 'reject'}
                      onClick={() => handleReject(getApptId(selected))}
                      icon={<HandThumbDownIcon className="w-4 h-4" />}
                    >Decline</Button>
                  </div>
                </>
              )}

              {selected.status === 'confirmed' && (
                <div className="flex gap-2 flex-wrap">
                  <Button className="flex-1" variant="primary"
                    onClick={() => {
                      const appt = selected
                      setViewOpen(false)
                      openTreatmentWorkflow(appt)
                    }}
                    icon={<ClipboardDocumentListIcon className="w-4 h-4" />}
                  >Create Medical Record &amp; Prescription</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Treatment Workflow Modal (Medical Record -> Prescription -> Complete) */}
      <TreatmentWorkflowModal
        open={treatmentModalOpen}
        onClose={() => { setTreatmentModalOpen(false); setTreatmentAppt(null) }}
        appointment={treatmentAppt}
        doctorId={user?.id}
        onSuccess={(id) => updateStatus(id, 'completed')}
      />


    </div>
  )
}