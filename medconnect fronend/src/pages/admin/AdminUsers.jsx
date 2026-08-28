import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon, FunnelIcon,
  CheckCircleIcon, XCircleIcon, EyeIcon, KeyIcon
} from '@heroicons/react/24/outline'
import { adminService, patientService, doctorService, hospitalService } from '@/api/services'
import { Avatar, Badge, Pagination, Modal } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { maskEmail, maskPhone } from '@/utils/maskData'
import { Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_OPTIONS = [
  { value: '',         label: 'All roles'   },
  { value: 'patient',  label: 'Patient'     },
  { value: 'doctor',   label: 'Doctor'      },
  { value: 'hospital', label: 'Hospital'    },
]

const STATUS_OPTIONS = [
  { value: '',       label: 'All statuses' },
  { value: 'active', label: 'Active'       },
  { value: 'inactive', label: 'Inactive'   },
]

export default function AdminUsers() {
  const [query,        setQuery]        = useState('')
  const [roleFilter,   setRoleFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toggling,     setToggling]     = useState({})
  const [users,        setUsers]        = useState([])
  const [fetching,     setFetching]     = useState(true)

  const [selectedUser,    setSelectedUser]    = useState(null)
  const [detailModal,     setDetailModal]     = useState(false)
  const [loadingDetails,  setLoadingDetails]  = useState(false)
  const [detailsData,     setDetailsData]     = useState(null)

  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  useEffect(() => {
    let cancelled = false
    setFetching(true)
    adminService.getAllUsers()
      .then(res => {
        if (!cancelled) setUsers(res.data || [])
      })
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [])

  const handleViewDetails = async (userObj) => {
    setSelectedUser(userObj)
    setDetailModal(true)
    setLoadingDetails(true)
    setDetailsData(null)
    try {
      let res
      if (userObj.role === 'patient') {
        res = await patientService.getById(userObj.entityId)
      } else if (userObj.role === 'doctor') {
        res = await doctorService.getById(userObj.entityId)
      } else if (userObj.role === 'hospital') {
        res = await hospitalService.getById(userObj.entityId)
      }
      setDetailsData(res?.data || null)
    } catch (err) {
      toast.error('Failed to load profile details.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const filtered = users.filter((u) => {
    const matchQ      = !debouncedQ || u.fullName.toLowerCase().includes(debouncedQ.toLowerCase()) || (u.email || '').includes(debouncedQ)
    const matchRole   = !roleFilter   || u.role === roleFilter
    const matchStatus = !statusFilter || (statusFilter === 'active' ? u.status === 'ACTIVE' : u.status !== 'ACTIVE')
    return matchQ && matchRole && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  const handleToggle = async (userId, currentlyActive, role) => {
    setToggling((prev) => ({ ...prev, [userId]: true }))
    try {
      if (currentlyActive) {
        await adminService.deactivateUser(userId, role)
        setUsers(prev => prev.map(u => u.entityId === userId ? { ...u, status: 'INACTIVE' } : u))
        toast.success('User deactivated.')
      } else {
        await adminService.activateUser(userId, role)
        setUsers(prev => prev.map(u => u.entityId === userId ? { ...u, status: 'ACTIVE' } : u))
        toast.success('User activated.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed.')
    } finally {
      setToggling((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">All Users</h1>
        <p className="page-sub">Manage all registered platform users</p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Total',     count: users.length,                                   class: 'badge-neutral'  },
          { label: 'Patients',  count: users.filter(u => u.role === 'patient').length,  class: 'badge-info'     },
          { label: 'Doctors',   count: users.filter(u => u.role === 'doctor').length,   class: 'badge-primary'  },
          { label: 'Hospitals', count: users.filter(u => u.role === 'hospital').length, class: 'badge-success'  },
          { label: 'Inactive',  count: users.filter(u => u.status !== 'ACTIVE').length, class: 'badge-danger'   },
        ].map((b) => (
          <span key={b.label} className={b.class}>
            {b.label}: <strong>{fetching ? '…' : b.count}</strong>
          </span>
        ))}
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
              placeholder="Search by name or email…"
              className="input pl-9"
            />
          </div>
          <select value={roleFilter}   onChange={(e) => { setRoleFilter(e.target.value);   goTo(1) }} className="input w-full sm:w-40">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); goTo(1) }} className="input w-full sm:w-40">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No users found</td></tr>
              ) : paginated.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} size="sm" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p>{maskEmail(user.email)}</p>
                      {user.mobile && <p>{maskPhone(user.mobile)}</p>}
                    </div>
                  </td>
                  <td>
                    <span className={clsx(
                      'badge',
                      user.role === 'patient'  && 'badge-info',
                      user.role === 'doctor'   && 'badge-primary',
                      user.role === 'hospital' && 'badge-success',
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}>
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="btn btn-secondary btn-sm gap-1 text-xs"
                        title="View Full Profile Details"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleToggle(user.entityId, user.status === 'ACTIVE', user.role)}
                        disabled={toggling[user.entityId]}
                        className={clsx(
                          'btn btn-sm gap-1 text-xs',
                          user.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'
                        )}
                      >
                        {toggling[user.entityId] ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : user.status === 'ACTIVE' ? (
                          <XCircleIcon className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        )}
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={goTo}
            pageSize={limit} onPageSizeChange={changeLimit} total={filtered.length} />
        </div>
      </div>
      )}

      {/* Profile Details Modal */}
      {selectedUser && (
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title={`Full Profile Details — ${selectedUser.role.toUpperCase()}`}>
          {loadingDetails ? (
            <div className="space-y-4 animate-pulse py-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ) : detailsData ? (
            <div className="space-y-5 text-sm text-slate-600 dark:text-slate-350">
              {/* Account Credentials */}
              <div className="bg-primary-50/50 dark:bg-primary-950/10 p-4 rounded-xl space-y-3 border border-primary-100/50 dark:border-primary-900/10">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <KeyIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  Account Security & Login Credentials
                </h4>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">User ID (Email)</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{detailsData.email || selectedUser.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Password</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono select-all">[SECURED] (BCrypt Cryptographically Hashed on Registration)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-1 leading-relaxed">
                  Note: Passwords are encrypted using one-way BCrypt cryptographic hashing for data privacy compliance. They cannot be retrieved in plaintext.
                </p>
              </div>

              {/* Profile Details depending on role */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Profile Information
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400">Full Name</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {detailsData.doctorName || detailsData.hospitalName || detailsData.fullName || selectedUser.fullName}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400">Contact Number</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {detailsData.mobile || detailsData.phone || '—'}
                    </p>
                  </div>

                  {selectedUser.role === 'patient' && (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Gender</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{detailsData.gender || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Date of Birth</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.dateOfBirth || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Blood Group</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.bloodGroup || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Address</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.address || '—'}</p>
                      </div>
                      <div className="space-y-0.5 sm:col-span-2">
                        <span className="text-xs text-slate-400">Emergency Contact</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.emergencyContact || '—'}</p>
                      </div>
                    </>
                  )}

                  {selectedUser.role === 'doctor' && (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Specialization</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.specialization || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Qualification</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.qualification || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Experience</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.experience != null ? `${detailsData.experience} years` : '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Consultation Fee</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">₹{detailsData.consultationFee}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">License Number</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 font-mono">{detailsData.licenseNumber || '—'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Affiliated Hospital ID</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 font-mono">{detailsData.hospitalId || '—'}</p>
                      </div>
                    </>
                  )}

                  {selectedUser.role === 'hospital' && (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">City / State</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {detailsData.city ? `${detailsData.city}, ${detailsData.state || ''}` : '—'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs text-slate-400">Pincode</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 font-mono">{detailsData.pincode || '—'}</p>
                      </div>
                      <div className="space-y-0.5 sm:col-span-2">
                        <span className="text-xs text-slate-400">Address</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{detailsData.address || '—'}</p>
                      </div>
                      <div className="space-y-0.5 sm:col-span-2">
                        <span className="text-xs text-slate-400">Registration Number</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 font-mono">{detailsData.registrationNumber || '—'}</p>
                      </div>
                    </>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-400">Account Status</span>
                    <div>
                      <span className={clsx(
                        'badge text-xs uppercase',
                        detailsData.status === 'ACTIVE' || detailsData.status === 'APPROVED' ? 'badge-success' : 'badge-danger'
                      )}>
                        {detailsData.status || selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Failed to load detailed profile.</p>
          )}

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setDetailModal(false)} className="btn btn-secondary btn-sm">
              Close Details
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
