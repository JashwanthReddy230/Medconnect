import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { doctorService } from '@/api/doctorService'
import { Avatar, Badge, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { normalizeDoctors } from '@/utils/normalizers'
import { Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '',         label: 'All statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
]

const SPEC_OPTIONS = [
  '', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedic', 'Psychiatrist', 'General Physician',
  'Pediatrician', 'Gynecologist', 'ENT Specialist',
].map(v => ({ value: v, label: v || 'All specialties' }))

export default function AdminDoctors() {
  const [query,   setQuery]   = useState('')
  const [status,  setStatus]  = useState('')
  const [spec,    setSpec]    = useState('')
  const [loading, setLoading] = useState({})
  const [doctors, setDoctors] = useState([])
  const [fetching, setFetching] = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    doctorService.getAll()
      .then(res => {
        if (!cancelled) setDoctors(normalizeDoctors(res.data || []))
      })
      .catch(() => toast.error('Failed to load doctors.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = doctors.filter((d) => {
    const matchQ    = !debouncedQ || d.fullName.toLowerCase().includes(debouncedQ.toLowerCase()) || (d.email || '').includes(debouncedQ)
    const matchStat = !status || d.status === status
    const matchSpec = !spec   || d.specialization === spec
    return matchQ && matchStat && matchSpec
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const updateStatus = (id, newStatus) =>
    setDoctors((p) => p.map((d) => String(d.id) === String(id) ? { ...d, status: newStatus } : d))

  const handleActivate = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'activate' }))
    try {
      await doctorService.approve(id)
      updateStatus(id, 'ACTIVE')
      toast.success('Doctor activated.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to activate.')
    } finally {
      setLoading((p) => ({ ...p, [id]: null }))
    }
  }

  const handleDeactivate = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'deactivate' }))
    try {
      await doctorService.reject(id)
      updateStatus(id, 'INACTIVE')
      toast.success('Doctor deactivated.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate.')
    } finally {
      setLoading((p) => ({ ...p, [id]: null }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">All Doctors</h1>
          <p className="page-sub">{fetching ? 'Loading…' : `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''} registered`}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search by name or email…"
              className="input pl-9"
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); goTo(1) }} options={STATUS_OPTIONS} />
          <Select value={spec}   onChange={(e) => { setSpec(e.target.value); goTo(1) }}   options={SPEC_OPTIONS} />
        </div>
      </div>

      {/* Table */}
      {fetching ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Fee</th>
                  <th>Hospital ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                      No doctors found
                    </td>
                  </tr>
                ) : paginated.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={doc.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.fullName}</p>
                          <p className="text-xs text-slate-400">{doc.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-sm text-slate-600 dark:text-slate-300">{doc.specialization || '—'}</span></td>
                    <td><span className="text-sm text-slate-600 dark:text-slate-300">{doc.consultationFee != null ? `₹${doc.consultationFee}` : '—'}</span></td>
                    <td><span className="text-sm text-slate-500 dark:text-slate-400">{doc.hospitalId || '—'}</span></td>
                    <td>
                      <span className={clsx(
                        'badge text-xs capitalize',
                        doc.status === 'ACTIVE'   && 'badge-success',
                        doc.status === 'INACTIVE' && 'badge-danger',
                        !['ACTIVE','INACTIVE'].includes(doc.status) && 'badge-warning'
                      )}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {doc.status !== 'ACTIVE' ? (
                          <Button size="sm" loading={loading[doc.id] === 'activate'}
                            onClick={() => handleActivate(doc.id)}
                            icon={<CheckCircleIcon className="w-3.5 h-3.5" />}>
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" loading={loading[doc.id] === 'deactivate'}
                            onClick={() => handleDeactivate(doc.id)}
                            icon={<XCircleIcon className="w-3.5 h-3.5" />}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!fetching && paginated.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goTo}
          pageSize={limit} onPageSizeChange={changeLimit} total={filtered.length} />
      )}
    </div>
  )
}
