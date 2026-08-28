import { useState, useEffect } from 'react'
import {
  BanknotesIcon, MagnifyingGlassIcon, ArrowPathIcon,
  BuildingOffice2Icon, UsersIcon, CheckCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { paymentService, hospitalService } from '@/api/services'
import { Modal, Pagination, EmptyState } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatDate } from '@/utils/formatters'
import { tokenManager } from '@/utils/tokenManager'
import toast from 'react-hot-toast'

export default function HospitalTransactions() {
  const { user } = useAuth()
  const [payments,   setPayments]   = useState([])
  const [doctors,    setDoctors]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selected,   setSelected]   = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 6)

  const profile = tokenManager.loadProfile() || {}
  const hospitalId = profile.id || user?.id

  const fetchLedger = async () => {
    if (!hospitalId) return
    setLoading(true)
    try {
      const [payRes, docRes] = await Promise.allSettled([
        paymentService.getHospitalPayments(hospitalId),
        hospitalService.getDoctors(hospitalId),
      ])

      const docs = docRes.status === 'fulfilled' ? (docRes.value.data || []) : []
      setDoctors(docs)

      const docDeptMap = {}
      docs.forEach(d => {
        if (d.id || d._id) {
          docDeptMap[String(d.id || d._id)] = d.specialization || d.specialty || 'General'
        }
      })

      const rawPayments = payRes.status === 'fulfilled' ? (payRes.value.data || []) : []
      const enriched = rawPayments.map(p => ({
        ...p,
        departmentName: p.departmentName || docDeptMap[String(p.doctorId)] || 'General Medicine'
      }))

      setPayments(enriched)
    } catch {
      toast.error('Failed to load transaction ledger.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [hospitalId])

  const departments = ['all', ...new Set(payments.map(p => p.departmentName).filter(Boolean))]

  const filtered = payments.filter((p) => {
    const matchQ = !debouncedQ ||
      (p.transactionHash || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (p.patientName || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (p.doctorName || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      String(p.patientId || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      String(p.doctorId || '').toLowerCase().includes(debouncedQ.toLowerCase())

    const matchDept = selectedDept === 'all' || p.departmentName === selectedDept
    return matchQ && matchDept
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)
  const totalRevenue = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Hospital Financial Ledger</h1>
          <p className="page-sub">Monitor all appointment bookings, transaction hashes, and payment statuses</p>
        </div>
        <button onClick={fetchLedger} className="btn btn-secondary btn-sm gap-2 self-start">
          <ArrowPathIcon className="w-4 h-4" /> Refresh Ledger
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Collections</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400">{payments.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Transactions</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{departments.length - 1}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Departments Generated</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400">100%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Settlement Status</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); goTo(1) }}
            placeholder="Search Patient Name/ID, Doctor Name/ID, or Payment Hash…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); goTo(1) }}
            className="input text-xs w-48"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Ledger Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="w-8 h-8" />}
          title="No transactions recorded"
          description="Patient appointment payments will appear here in real-time."
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID / Hash</th>
                  <th>Patient Details</th>
                  <th>Doctor Details</th>
                  <th>Department</th>
                  <th>Fee Amount</th>
                  <th>Date &amp; Status</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((txn) => (
                  <tr key={txn.transactionHash || txn.appointmentId}>
                    <td>
                      <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                        {txn.transactionHash || 'TXN-SUCCESS'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{txn.patientName}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: {txn.patientId || 'PAT-01'}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{txn.doctorName}</p>
                        <p className="text-xs text-slate-400 font-mono">ID: DOC-{txn.doctorId}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge-neutral text-xs">
                        {txn.departmentName || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className="font-black text-slate-900 dark:text-white">₹{txn.amount}</span>
                    </td>
                    <td>
                      <div className="text-xs">
                        <p className="text-slate-600 dark:text-slate-300">{formatDate(txn.createdAt)}</p>
                        <span className="badge-success text-[10px] mt-0.5">PAID</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelected(txn); setDetailModal(true) }}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        Inspect
                      </button>
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

      {/* Transaction Details Modal */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Transaction Audit Detail" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Hash</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{selected.transactionHash}</span>
              </div>
              <div className="divider my-1" />
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name &amp; ID:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.patientName} (ID: {selected.patientId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor Name &amp; ID:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.doctorName} (ID: DOC-{selected.doctorId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Derived Department:</span>
                <span className="font-medium text-primary-600 dark:text-primary-400">{selected.departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital:</span>
                <span className="text-slate-700 dark:text-slate-300">{selected.hospitalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway/Method:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selected.paymentMethod || 'UPI'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Time:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(selected.createdAt)}</span>
              </div>
              <div className="divider my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-100">Consultation Fee:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{selected.amount}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setDetailModal(false)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
