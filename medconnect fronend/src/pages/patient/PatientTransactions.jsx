import { useState, useEffect } from 'react'
import {
  BanknotesIcon, MagnifyingGlassIcon, CheckCircleIcon,
  DocumentTextIcon, CalendarIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { paymentService } from '@/api/services'
import { Modal, Pagination, EmptyState } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function PatientTransactions() {
  const { user } = useAuth()
  const [payments,   setPayments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [selected,   setSelected]   = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 6)

  const fetchPayments = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await paymentService.getPatientPayments(user.id)
      setPayments(res.data || [])
    } catch {
      toast.error('Failed to load transaction history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [user?.id])

  const filtered = payments.filter((p) => {
    if (!debouncedQ) return true
    const q = debouncedQ.toLowerCase()
    return (
      (p.transactionHash || '').toLowerCase().includes(q) ||
      (p.doctorName || '').toLowerCase().includes(q) ||
      (p.hospitalName || '').toLowerCase().includes(q) ||
      (p.paymentMethod || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)
  const totalSpent = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-sub">View and inspect your appointment payment receipts</p>
        </div>
        <button onClick={fetchPayments} className="btn btn-secondary btn-sm gap-2 self-start">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BanknotesIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">₹{totalSpent}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Consultation Fees Paid</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <DocumentTextIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{payments.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed Transactions</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">100%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Payment Success Rate</p>
          </div>
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
            placeholder="Search by transaction hash, doctor, or hospital…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="w-8 h-8" />}
          title="No transactions found"
          description="Your payment history will appear here once you pay for confirmed appointments."
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Doctor &amp; Hospital</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((txn) => (
                  <tr key={txn.transactionHash || txn.appointmentId}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {txn.transactionHash || 'TXN-SUCCESS'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{txn.doctorName}</p>
                        <p className="text-xs text-slate-400">{txn.hospitalName}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{formatDate(txn.createdAt)}</p>
                    </td>
                    <td>
                      <span className="badge-neutral text-[10px] uppercase">{txn.paymentMethod || 'UPI'}</span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-800 dark:text-slate-100">₹{txn.amount}</span>
                    </td>
                    <td>
                      <span className="badge-success">Paid</span>
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelected(txn); setDetailModal(true) }}
                        className="btn btn-secondary btn-sm gap-1 text-xs"
                      >
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        Receipt
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

      {/* Receipt Modal */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Official Payment Receipt" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction / Invoice ID</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                  {selected.transactionId || selected.transactionHash}
                  {selected.invoiceNumber && ` (${selected.invoiceNumber})`}
                </span>
              </div>
              {selected.billNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill Number:</span>
                  <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{selected.billNumber}</span>
                </div>
              )}
              <div className="divider my-1" />
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Doctor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility:</span>
                <span className="text-slate-700 dark:text-slate-300">{selected.hospitalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700 dark:text-slate-300">{selected.departmentName || 'General Practice'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selected.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(selected.paymentDate || selected.createdAt)}</span>
              </div>
              <div className="divider my-1" />
              
              {/* Fee Breakdown if present */}
              {selected.consultationFee != null && (
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg">
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span>₹{selected.consultationFee || selected.amount || 0}</span>
                  </div>
                  {selected.medicineFee > 0 && (
                    <div className="flex justify-between">
                      <span>Medicine Fee:</span>
                      <span>₹{selected.medicineFee}</span>
                    </div>
                  )}
                  {selected.laboratoryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Laboratory Fee:</span>
                      <span>₹{selected.laboratoryFee}</span>
                    </div>
                  )}
                  {selected.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>+₹{selected.tax}</span>
                    </div>
                  )}
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount:</span>
                      <span>-₹{selected.discount}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-800 dark:text-slate-100">Total Amount Charged:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{selected.totalAmount || selected.amount}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setDetailModal(false)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
