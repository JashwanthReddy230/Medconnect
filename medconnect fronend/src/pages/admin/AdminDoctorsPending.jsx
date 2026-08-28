import { useState, useEffect } from 'react'
import {
  CheckCircleIcon, XCircleIcon, EyeIcon,
  ShieldCheckIcon, ClockIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { doctorService } from '@/api/services'
import { Avatar, Badge, Modal, EmptyState } from '@/components/common/index.jsx'
import { formatRelative, formatDate } from '@/utils/formatters'
import { normalizeDoctors } from '@/utils/normalizers'
import { maskEmail, maskPhone } from '@/utils/maskData'
import Button from '@/components/common/Button.jsx'
import { TextArea } from '@/components/common/FormFields.jsx'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminDoctorsPending() {
  const [doctors,      setDoctors]     = useState([])
  const [fetching,     setFetching]    = useState(true)
  const [selected,     setSelected]    = useState(null)
  const [viewModal,    setViewModal]   = useState(false)
  const [rejectModal,  setRejectModal] = useState(false)
  const [loading,      setLoading]     = useState({})
  const [query,        setQuery]       = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    doctorService.getAll()
      .then(res => {
        if (!cancelled) {
          const all = normalizeDoctors(res.data || [])
          // Filter to non-active doctors (pending / inactive)
          setDoctors(all.filter(d => d.status !== 'ACTIVE'))
        }
      })
      .catch(() => toast.error('Failed to load pending doctors.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = doctors.filter((d) =>
    d.status !== 'ACTIVE' &&
    (!query || d.fullName.toLowerCase().includes(query.toLowerCase()) || (d.specialization || '').toLowerCase().includes(query.toLowerCase()))
  )

  const handleApprove = async (doctorId) => {
    setLoading((p) => ({ ...p, [doctorId]: 'approve' }))
    try {
      await doctorService.approve(doctorId)
      setDoctors((prev) => prev.filter(d => String(d.id) !== String(doctorId)))
      toast.success('Doctor approved successfully!')
      setViewModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve. Please try again.')
    } finally {
      setLoading((p) => ({ ...p, [doctorId]: null }))
    }
  }

  const handleRejectSubmit = async ({ reason }) => {
    if (!selected) return
    const doctorId = selected.id
    setLoading((p) => ({ ...p, [doctorId]: 'reject' }))
    try {
      await doctorService.reject(doctorId, reason)
      setDoctors((prev) => prev.filter(d => String(d.id) !== String(doctorId)))
      toast.success('Doctor application rejected.')
      setRejectModal(false)
      setViewModal(false)
      reset()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject. Please try again.')
    } finally {
      setLoading((p) => ({ ...p, [doctorId]: null }))
    }
  }

  const openView   = (doc) => { setSelected(doc); setViewModal(true)  }
  const openReject = (doc) => { setSelected(doc); setRejectModal(true) }

  const pendingCount = doctors.length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
            Doctor Approvals
          </h1>
          <p className="page-sub">Review and verify doctor registrations</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge-warning text-sm self-start">
            <ClockIcon className="w-4 h-4" />
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialty…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Cards grid */}
      {fetching ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="w-8 h-8" />}
          title="No pending approvals"
          description="All doctor applications have been reviewed."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const state = loading[doc.id]

            return (
              <div key={doc.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={doc.fullName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{doc.fullName}</h3>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">{doc.specialization || '—'}</p>
                    <p className="text-xs text-slate-400 mt-1">{maskEmail(doc.email)}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted-light dark:bg-muted-dark rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">License ID</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{doc.licenseNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience</span>
                    <span className="text-slate-700 dark:text-slate-300">{doc.experience != null ? `${doc.experience} years` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee</span>
                    <span className="text-slate-700 dark:text-slate-300">₹{doc.consultationFee}</span>
                  </div>
                  {doc.hospitalId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hospital ID</span>
                      <span className="text-slate-700 dark:text-slate-300">{doc.hospitalId}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button onClick={() => openView(doc)} className="btn btn-secondary btn-sm gap-1 flex-1 text-xs">
                    <EyeIcon className="w-3.5 h-3.5" />
                    Review
                  </button>
                  <Button
                    size="sm"
                    loading={state === 'approve'}
                    onClick={() => handleApprove(doc.id)}
                    icon={<CheckCircleIcon className="w-3.5 h-3.5" />}
                    className="flex-1 text-xs"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Details Modal */}
      {selected && (
        <Modal open={viewModal} onClose={() => setViewModal(false)} title="Review Doctor Application">
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <Avatar name={selected.fullName} size="xl" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{selected.fullName}</h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium">{selected.specialization || '—'}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Email</span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.email || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Phone</span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.mobile || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">License Number</span>
                <p className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{selected.licenseNumber || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Experience</span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.experience != null ? `${selected.experience} years` : '—'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500">Bio</span>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-muted-light dark:bg-muted-dark p-3 rounded-xl">
                {selected.bio || 'No bio provided.'}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setViewModal(false)} className="btn btn-secondary btn-sm">Close</button>
              <button onClick={() => openReject(selected)} className="btn btn-danger btn-sm gap-1 flex items-center">
                <XCircleIcon className="w-4 h-4" /> Reject
              </button>
              <Button
                size="sm"
                loading={loading[selected.id] === 'approve'}
                onClick={() => handleApprove(selected.id)}
                icon={<CheckCircleIcon className="w-4 h-4" />}
              >
                Approve
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {selected && (
        <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Application">
          <form onSubmit={handleSubmit(handleRejectSubmit)} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-350">
              Provide a reason for rejecting <strong>{selected.fullName}</strong>. This feedback will help them correct their details.
            </p>
            <TextArea
              label="Reason for rejection"
              placeholder="e.g., Invalid license registration document, incorrect specialty matches..."
              {...register('reason', { required: 'Please provide a reason' })}
              error={errors.reason}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setRejectModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <Button type="submit" variant="danger" size="sm" loading={loading[selected.id] === 'reject'}>Reject Application</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
