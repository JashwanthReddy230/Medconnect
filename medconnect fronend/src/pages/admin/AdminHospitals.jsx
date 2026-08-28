import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, MapPinIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { hospitalService } from '@/api/services'
import { Avatar, Badge, Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { normalizeHospitals } from '@/utils/normalizers'
import { Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'


export default function AdminHospitals() {
  const [query,     setQuery]     = useState('')
  const [status,    setStatus]    = useState('')
  const [loading,   setLoading]   = useState({})
  const [hospitals, setHospitals] = useState([])
  const [fetching,  setFetching]  = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 8)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    hospitalService.getAll()
      .then(res => {
        if (!cancelled) setHospitals(normalizeHospitals(res.data || []))
      })
      .catch(() => toast.error('Failed to load hospitals.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = hospitals.filter((h) => {
    const matchQ = !debouncedQ || h.hospitalName.toLowerCase().includes(debouncedQ.toLowerCase()) || (h.city || '').toLowerCase().includes(debouncedQ.toLowerCase())
    const matchS = !status || h.status === status
    return matchQ && matchS
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const updateStatus = (id, s) => setHospitals((p) => p.map((h) => String(h.id) === String(id) ? { ...h, status: s } : h))

  const handleApprove = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'approve' }))
    try { await hospitalService.approve(id); updateStatus(id, 'APPROVED'); toast.success('Hospital approved!') }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  const handleReject = async (id) => {
    setLoading((p) => ({ ...p, [id]: 'reject' }))
    try { await hospitalService.reject(id, 'Rejected by admin'); updateStatus(id, 'rejected'); toast.success('Hospital rejected.') }
    catch { toast.error('Failed.') }
    finally { setLoading((p) => ({ ...p, [id]: null })) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Hospitals & Clinics</h1>
        <p className="page-sub">Manage all registered healthcare facilities</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['Total',    hospitals.length,                                           'badge-neutral'],
          ['Approved', hospitals.filter(h => h.status === 'APPROVED').length,     'badge-success'],
          ['Pending',  hospitals.filter(h => h.status === 'PENDING').length,      'badge-warning'],
        ].map(([l, c, cls]) => <span key={l} className={cls}>{l}: <strong>{fetching ? '…' : c}</strong></span>)}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); goTo(1) }} placeholder="Search by name or city…" className="input pl-9" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); goTo(1) }} className="input w-full sm:w-40">
          {[['', 'All statuses'], ['APPROVED', 'Approved'], ['PENDING', 'Pending']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {fetching ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.length === 0 ? (
          <div className="col-span-full card py-12 text-center text-sm text-slate-400">No hospitals match your filters.</div>
        ) : paginated.map((hosp) => {
          const state = loading[hosp.id]
          const statusClass = hosp.status === 'APPROVED' ? 'badge-success' : hosp.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
          return (
            <div key={hosp.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <BuildingOffice2Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{hosp.hospitalName}</h3>
                  {hosp.city && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPinIcon className="w-3 h-3" />{hosp.city}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{hosp.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={statusClass}>{hosp.status}</span>
                <div className="flex gap-2">
                  {hosp.status !== 'APPROVED' && (
                    <Button size="sm" loading={state === 'approve'} onClick={() => handleApprove(hosp.id)} icon={<CheckCircleIcon className="w-3.5 h-3.5" />} className="text-xs">Approve</Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {!fetching && <Pagination page={page} totalPages={totalPages} onPageChange={goTo} pageSize={limit} onPageSizeChange={changeLimit} total={filtered.length} />}

    </div>
  )
}
