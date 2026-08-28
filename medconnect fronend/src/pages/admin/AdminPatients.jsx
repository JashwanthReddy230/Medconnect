import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { patientService } from '@/api/services'
import { Avatar, Badge, Pagination, EmptyState } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { normalizePatients } from '@/utils/normalizers'
import Button from '@/components/common/Button.jsx'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: '',         label: 'All statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
]

export default function AdminPatients() {
  const [query,    setQuery]    = useState('')
  const [status,   setStatus]   = useState('')
  const [patients, setPatients] = useState([])
  const [fetching, setFetching] = useState(true)
  const [actions,  setActions]  = useState({}) // { [id]: 'activating'|'deactivating' }
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    patientService.getAll()
      .then(res => {
        if (!cancelled) setPatients(normalizePatients(res.data || []))
      })
      .catch(() => toast.error('Failed to load patients.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = patients.filter((p) => {
    const matchQ  = !debouncedQ ||
      p.fullName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      p.email.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      p.mobile.includes(debouncedQ)
    const matchSt = !status || p.status === status
    return matchQ && matchSt
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const handleActivate = async (patient) => {
    setActions(p => ({ ...p, [patient.id]: 'activating' }))
    try {
      await patientService.activate(patient.id)
      setPatients(ps => ps.map(p => p.id === patient.id ? { ...p, status: 'ACTIVE' } : p))
      toast.success(`${patient.fullName} activated.`)
    } catch { toast.error('Failed to activate patient.') }
    finally { setActions(p => ({ ...p, [patient.id]: null })) }
  }

  const handleDeactivate = async (patient) => {
    setActions(p => ({ ...p, [patient.id]: 'deactivating' }))
    try {
      await patientService.deactivate(patient.id)
      setPatients(ps => ps.map(p => p.id === patient.id ? { ...p, status: 'INACTIVE' } : p))
      toast.success(`${patient.fullName} deactivated.`)
    } catch { toast.error('Failed to deactivate patient.') }
    finally { setActions(p => ({ ...p, [patient.id]: null })) }
  }

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete patient ${patient.fullName}? This cannot be undone.`)) return
    setActions(p => ({ ...p, [patient.id]: 'deleting' }))
    try {
      await patientService.delete(patient.id)
      setPatients(ps => ps.filter(p => p.id !== patient.id))
      toast.success('Patient deleted.')
    } catch { toast.error('Failed to delete patient.') }
    finally { setActions(p => ({ ...p, [patient.id]: null })) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">All Patients</h1>
          <p className="page-sub">
            {fetching ? 'Loading…' : `${filtered.length} patient${filtered.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="badge-info">{patients.filter(p => p.status === 'ACTIVE').length} Active</span>
          <span className="badge-warning">{patients.filter(p => p.status !== 'ACTIVE').length} Inactive</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search by name, email, or phone…"
              className="input pl-9"
            />
          </div>
          <div className="sm:w-44">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); goTo(1) }}
              className="input"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {(query || status) && (
            <button
              onClick={() => { setQuery(''); setStatus(''); goTo(1) }}
              className="btn btn-secondary btn-sm self-start"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {fetching ? (
        <div className="card p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-8 h-8" />}
          title="No patients found"
          description={query || status ? 'Try adjusting your search or filter.' : 'No patients registered yet.'}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Date of Birth</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((patient) => {
                  const action = actions[patient.id]
                  return (
                    <tr key={patient.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                              {patient.fullName || '—'}
                            </p>
                            <p className="text-xs text-slate-400">{patient.patientCode || `#P${patient.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{patient.email || '—'}</p>
                        <p className="text-xs text-slate-400">{patient.mobile || '—'}</p>
                      </td>
                      <td>
                        <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                          {patient.gender || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge-info text-xs">{patient.bloodGroup || '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={clsx(
                          'badge text-xs',
                          patient.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
                        )}>
                          {patient.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {patient.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={action === 'deactivating'}
                              onClick={() => handleDeactivate(patient)}
                              icon={<XCircleIcon className="w-3.5 h-3.5" />}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              loading={action === 'activating'}
                              onClick={() => handleActivate(patient)}
                              icon={<CheckCircleIcon className="w-3.5 h-3.5" />}
                            >
                              Activate
                            </Button>
                          )}
                          <button
                            onClick={() => handleDelete(patient)}
                            disabled={!!action}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete patient"
                          >
                            {action === 'deleting' ? (
                              <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
