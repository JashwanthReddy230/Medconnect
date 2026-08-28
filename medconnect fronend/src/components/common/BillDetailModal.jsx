import { Modal } from '@/components/common/index.jsx'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { BanknotesIcon, CalendarIcon, UserIcon, DocumentTextIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

export default function BillDetailModal({ open, onClose, bill, patientName, doctorName, onPay, paying }) {
  if (!bill) return null

  const id = bill.id || bill._id || '—'
  const billNumber = bill.billNumber || bill.number || `BILL-${id}`
  const appointmentId = bill.appointmentId || '—'
  const billDate = bill.billDate || bill.date || new Date().toISOString().split('T')[0]
  const patientId = bill.patientId || '—'
  const doctorId = bill.doctorId || '—'

  const consultationFee = parseFloat(bill.consultationFee ?? 0)
  const laboratoryFee = parseFloat(bill.laboratoryFee ?? 0)
  const medicineFee = parseFloat(bill.medicineFee ?? 0)
  const tax = parseFloat(bill.tax ?? 0)
  const discount = parseFloat(bill.discount ?? 0)
  const totalAmount = parseFloat(bill.totalAmount ?? (consultationFee + laboratoryFee + medicineFee + tax - discount))
  const paymentStatus = (bill.paymentStatus || bill.status || 'PENDING').toUpperCase()

  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED'

  return (
    <Modal open={open} onClose={onClose} title="Medical Bill & Invoice" size="md">
      <div className="space-y-4 text-xs">
        {/* Header summary */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-border-light dark:border-border-dark">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bill Number</span>
            <span className="font-mono font-bold text-sm text-primary-600 dark:text-primary-400">{billNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Status</span>
            <span className={isPaid ? 'badge-success' : 'badge-warning'}>{paymentStatus}</span>
          </div>
        </div>

        {/* 13 Field Detail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted-light dark:bg-muted-dark rounded-xl">
          <div>
            <span className="text-slate-400 block font-medium">ID</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{id}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bill Number</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{billNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Appointment ID</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{appointmentId}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bill Date</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(billDate)}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Patient ID</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{patientId}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Doctor ID</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{doctorId}</span>
          </div>
        </div>

        {/* Additional metadata if available */}
        {(patientName || doctorName) && (
          <div className="grid grid-cols-2 gap-3 px-1 text-slate-600 dark:text-slate-300">
            {patientName && <div><span className="text-slate-400 font-medium">Patient: </span><span className="font-semibold">{patientName}</span></div>}
            {doctorName && <div><span className="text-slate-400 font-medium">Doctor: </span><span className="font-semibold">{doctorName}</span></div>}
          </div>
        )}

        {/* Fee Breakdown Table */}
        <div className="card p-0 overflow-hidden border border-border-light dark:border-border-dark">
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200 border-b border-border-light dark:border-border-dark">
            Fee Breakdown
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Consultation Fee</span>
              <span className="font-semibold font-mono">{formatCurrency(consultationFee)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Medicine Fee</span>
              <span className="font-semibold font-mono">{formatCurrency(medicineFee)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Laboratory Fee</span>
              <span className="font-semibold font-mono">{formatCurrency(laboratoryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Tax (GST 18%)</span>
              <span className="font-semibold font-mono">{formatCurrency(tax)}</span>
            </div>

            <div className="border-t border-border-light dark:border-border-dark pt-2 mt-2 flex justify-between items-center text-sm font-bold text-slate-800 dark:text-slate-100">
              <span>Total Amount</span>
              <span className="text-base text-primary-600 dark:text-primary-400 font-mono">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary px-5">
            Close
          </button>
          {!isPaid && onPay && (
            <button
              onClick={() => onPay(bill)}
              disabled={paying}
              className="btn btn-primary px-5 disabled:opacity-60"
            >
              {paying ? 'Processing…' : `Pay Now (${formatCurrency(totalAmount)})`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}