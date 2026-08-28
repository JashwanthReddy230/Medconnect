import { useState, useEffect } from 'react'
import {
  UsersIcon, CheckCircleIcon, XCircleIcon,
  MagnifyingGlassIcon, PlusIcon, ClockIcon,
  ShieldCheckIcon, EnvelopeIcon, PhoneIcon,
  ExclamationCircleIcon, HandThumbUpIcon, HandThumbDownIcon,
  EyeIcon, CurrencyRupeeIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { doctorService, hospitalService } from '@/api/services'
import { Avatar, Badge, EmptyState, Modal, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { normalizeDoctors } from '@/utils/normalizers'
import { tokenManager } from '@/utils/tokenManager'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = ['all', 'pending', 'active']

export default function HospitalDoctors() {
  const { user } = useAuth()
  const [doctors,    setDoctors]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [actioning,  setActioning]  = useState({})
  const [activeTab,  setActiveTab]  = useState('all')
  const [query,      setQuery]      = useState('')
  const [selected,   setSelected]   = useState(null)
  const [viewOpen,   setViewOpen]   = useState(false)
  const [addModal,   setAddModal]   = useState(false)
  const [addForm,    setAddForm]    = useState({ doctorName: '', specialization: '', email: '', mobile: '', fee: '' })
  const [adding,     setAdding]     = useState(false)

  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 6)

  const profile = tokenManager.loadProfile() || {}
  const hospitalId = profile.id || user?.id || 1

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      // Fetch all doctors from backend
      const res = await doctorService.getAll()
      const allDocs = normalizeDoctors(res.data || [])
      // Filter doctors belonging to this hospital OR pending approval
      const myDocs = allDocs.filter(d =>
        !d.hospitalId || String(d.hospitalId) === String(hospitalId) || d.hospitalName === user?.fullName
      )
      setDoctors(myDocs.length > 0 ? myDocs : allDocs)
    } catch (err) {
      console.error('Failed to load hospital doctors:', err)
      toast.error('Failed to load doctors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [hospitalId, user?.fullName])

  // Filters
  const pendingDocs = doctors.filter(d => d.status === 'PENDING' || d.status === 'pending')
  const activeDocs  = doctors.filter(d => d.status === 'ACTIVE' || d.status === 'active' || d.status === 'approved')

  const filtered = doctors.filter(d => {
    const matchQ = !debouncedQ ||
      d.fullName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(debouncedQ.toLowerCase())
    if (activeTab === 'pending') return matchQ && (d.status === 'PENDING' || d.status === 'pending')
    if (activeTab === 'active')  return matchQ && (d.status === 'ACTIVE' || d.status === 'active' || d.status === 'approved')
    return matchQ
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  // ── Approve Doctor ──────────────────────────────────────────────────────────
  const handleApprove = async (docId) => {
    setActioning(p => ({ ...p, [docId]: 'approve' }))
    try {
      await doctorService.approve(docId)
      setDoctors(prev => prev.map(d => d.id === docId ? { ...d, status: 'ACTIVE' } : d))
      toast.success('Doctor approved and added to hospital roster!')
      if (selected?.id === docId) setSelected(prev => prev ? { ...prev, status: 'ACTIVE' } : null)
    } catch (err) {
      toast.error('Failed to approve doctor.')
    } finally {
      setActioning(p => ({ ...p, [docId]: null }))
    }
  }

  // ── Reject / Remove Doctor ──────────────────────────────────────────────────
  const handleReject = async (docId) => {
    setActioning(p => ({ ...p, [docId]: 'reject' }))
    try {
      await doctorService.reject(docId, 'Declined by hospital administrator')
      setDoctors(prev => prev.map(d => d.id === docId ? { ...d, status: 'INACTIVE' } : d))
      toast.success('Doctor status updated to inactive.')
      if (selected?.id === docId) setSelected(prev => prev ? { ...prev, status: 'INACTIVE' } : null)
    } catch (err) {
      toast.error('Failed to update doctor status.')
    } finally {
      setActioning(p => ({ ...p, [docId]: null }))
    }
  }

  // ── Manual Add Doctor ──────────────────────────────────────────────────────
  const handleAddDoctor = async (e) => {
    e.preventDefault()
    if (!addForm.doctorName || !addForm.specialization) {
      toast.error('Please enter doctor name and specialization.')
      return
    }
    setAdding(true)
    try {
      const payload = {
        doctorName: addForm.doctorName,
        specialization: addForm.specialization,
        email: addForm.email,
        mobile: addForm.mobile,
        consultationFee: parseFloat(addForm.fee) || 0,
        hospitalId: parseInt(hospitalId, 10),
        status: 'ACTIVE'
      }
      await doctorService.create(payload)
      toast.success('New doctor added successfully!')
      setAddModal(false)
      setAddForm({ doctorName: '', specialization: '', email: '', mobile: '', fee: '' })
      fetchDoctors()
    } catch (err) {
      toast.error('Failed to add doctor.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Our Doctors 👨‍⚕️👩‍⚕️</h1>
          <p className="page-sub">Manage affiliated doctors and process hospital join requests.</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon={<PlusIcon className="w-4 h-4" />} className="self-start sm:self-auto">
          Add new doctor
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{doctors.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Doctors</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingDocs.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending Approvals</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeDocs.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active Roster</p>
        </div>
      </div>

      {/* Pending approvals alert banner */}
      {!loading && pendingDocs.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber-400 flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ExclamationCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {pendingDocs.length} doctor approval request{pendingDocs.length > 1 ? 's' : ''} pending
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and accept doctors who have registered under your hospital.
            </p>
          </div>
          <button
            onClick={() => { setActiveTab('pending'); goTo(1) }}
            className="btn btn-secondary btn-sm flex-shrink-0"
          >
            Review now
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 w-full sm:w-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setActiveTab(t); goTo(1) }}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all flex items-center gap-1.5',
                  activeTab === t
                    ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {t === 'pending' ? 'Pending Approval' : t === 'active' ? 'Active Roster' : 'All Doctors'}
                {t === 'pending' && pendingDocs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingDocs.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search doctor name, specialty, email…"
              className="input pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-8 h-8" />}
          title="No doctors found"
          description={query || activeTab !== 'all' ? "Try changing your search or filter criteria." : "Add doctors to your hospital roster to get started."}
          action={<Button onClick={() => setAddModal(true)} size="sm">Add doctor</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {paginated.map((doc) => {
            const isPending = doc.status === 'PENDING' || doc.status === 'pending'
            const isActive  = doc.status === 'ACTIVE' || doc.status === 'active' || doc.status === 'approved'

            return (
              <div
                key={doc._id || doc.id}
                className={clsx(
                  'card p-5 flex flex-col justify-between space-y-4 transition-all',
                  isPending && 'border-l-4 border-l-amber-400 bg-amber-50/20 dark:bg-amber-900/10'
                )}
              >
                <div className="flex items-start gap-4">
                  <Avatar name={doc.fullName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.fullName}</h3>
                      <span className={clsx(
                        'badge text-[10px]',
                        isPending && 'badge-warning',
                        isActive && 'badge-success',
                        !isPending && !isActive && 'badge-neutral'
                      )}>
                        {isPending ? 'Pending Acceptance' : isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-0.5">
                      {doc.specialization || 'General Specialist'}
                    </p>

                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {doc.qualification && (
                        <p className="flex items-center gap-1.5">
                          <AcademicCapIcon className="w-3.5 h-3.5 text-slate-400" />
                          {doc.qualification}
                        </p>
                      )}
                      {doc.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                          {doc.email}
                        </p>
                      )}
                      {doc.mobile && (
                        <p className="flex items-center gap-1.5">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                          {doc.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400">Fee: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      ₹{doc.consultationFee || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelected(doc); setViewOpen(true) }}
                      className="btn btn-secondary btn-sm text-xs gap-1"
                    >
                      <EyeIcon className="w-3.5 h-3.5" /> Details
                    </button>

                    {/* Pending Approval Actions */}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          loading={actioning[doc.id] === 'approve'}
                          onClick={() => handleApprove(doc.id)}
                          icon={<HandThumbUpIcon className="w-3.5 h-3.5" />}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actioning[doc.id] === 'reject'}
                          onClick={() => handleReject(doc.id)}
                          icon={<HandThumbDownIcon className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {/* Active Actions */}
                    {isActive && (
                      <button
                        onClick={() => handleReject(doc.id)}
                        className="text-xs text-red-500 hover:underline px-2 py-1"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && paginated.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goTo}
          pageSize={limit}
          onPageSizeChange={changeLimit}
          total={filtered.length}
        />
      )}

      {/* Doctor Details Modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Doctor Profile Details">
        {selected && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <Avatar name={selected.fullName} size="xl" />
              <div>
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{selected.fullName}</h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium">{selected.specialization}</p>
                <span className={clsx(
                  'badge mt-1 text-[10px]',
                  selected.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                )}>
                  {selected.status}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 uppercase tracking-wide">Qualification</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5">{selected.qualification || 'MBBS'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wide">Consultation Fee</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5">₹{selected.consultationFee || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wide">Email</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5">{selected.email || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wide">Mobile</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 mt-0.5">{selected.mobile || '—'}</p>
              </div>
            </div>

            {(selected.status === 'PENDING' || selected.status === 'pending') && (
              <div className="pt-2 flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  loading={actioning[selected.id] === 'approve'}
                  onClick={() => { handleApprove(selected.id); setViewOpen(false) }}
                  icon={<HandThumbUpIcon className="w-4 h-4" />}
                >
                  Accept &amp; Approve Doctor
                </Button>
                <Button
                  className="flex-1"
                  variant="danger"
                  loading={actioning[selected.id] === 'reject'}
                  onClick={() => { handleReject(selected.id); setViewOpen(false) }}
                  icon={<HandThumbDownIcon className="w-4 h-4" />}
                >
                  Decline Request
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Doctor Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Doctor to Hospital">
        <form onSubmit={handleAddDoctor} className="space-y-4">
          <div>
            <label className="label">Doctor Full Name</label>
            <input
              type="text"
              required
              placeholder="Dr. Jane Doe"
              value={addForm.doctorName}
              onChange={(e) => setAddForm(f => ({ ...f, doctorName: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Specialization</label>
            <input
              type="text"
              required
              placeholder="Cardiologist, Neurologist, etc."
              value={addForm.specialization}
              onChange={(e) => setAddForm(f => ({ ...f, specialization: e.target.value }))}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                placeholder="doctor@hospital.com"
                value={addForm.email}
                onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={addForm.mobile}
                onChange={(e) => setAddForm(f => ({ ...f, mobile: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Consultation Fee (₹)</label>
            <input
              type="number"
              placeholder="500"
              value={addForm.fee}
              onChange={(e) => setAddForm(f => ({ ...f, fee: e.target.value }))}
              className="input"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setAddModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <Button type="submit" loading={adding}>
              Add Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
