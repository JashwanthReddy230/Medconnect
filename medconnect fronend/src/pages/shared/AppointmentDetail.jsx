import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon,
  BuildingOffice2Icon, CheckCircleIcon, XCircleIcon,
  ClipboardDocumentListIcon, ExclamationTriangleIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { appointmentService, billService, paymentService, invoiceService } from '@/api/services'
import { Avatar, Badge } from '@/components/common/index.jsx'
import TreatmentWorkflowModal from '@/components/doctor/TreatmentWorkflowModal.jsx'
import BillDetailModal from '@/components/common/BillDetailModal.jsx'
import { normalizeAppointment } from '@/utils/normalizers'
import { formatDateTime, appointmentStatusMap } from '@/utils/formatters'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AppointmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isDoctor = user?.role === 'doctor'
  const isPatient = user?.role === 'patient'

  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false)
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [viewingBill, setViewingBill] = useState(null)
  const [loadingBill, setLoadingBill] = useState(false)
  const [paying, setPaying] = useState(false)

  const handleViewBill = async () => {
    setLoadingBill(true)
    try {
      const res = await billService.getByAppointment(id)
      const billData = res?.data
      if (!billData) {
        toast.error('No bill has been generated for this appointment yet.')
        return
      }
      setViewingBill(billData)
      setBillModalOpen(true)
    } catch {
      toast.error('Failed to load bill details.')
    } finally {
      setLoadingBill(false)
    }
  }

  const handlePayBill = async (bill) => {
    setPaying(true)
    try {
      await paymentService.create({
        billId: bill.id,
        paymentMethod: 'UPI',
        amount: bill.totalAmount,
      })
      // Payment succeeded on the backend — Bill is now PAID and an Invoice has been generated.
      setViewingBill(prev => prev ? { ...prev, paymentStatus: 'PAID' } : prev)
      toast.success(`Payment of ₹${bill.totalAmount} completed successfully! Invoice generated.`)
      // Confirm the invoice exists so the patient can view it from Bills & Invoices.
      invoiceService.getByBill(bill.id).catch(() => { })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    appointmentService.getById(id)
      .then(res => setAppt(normalizeAppointment(res.data)))
      .catch(() => setError('Appointment not found or you do not have access.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment?')) return
    setCancelling(true)
    try {
      await appointmentService.cancel(id)
      setAppt(prev => ({ ...prev, status: 'cancelled', rawStatus: 'CANCELLED' }))
      toast.success('Appointment cancelled.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel.')
    } finally { setCancelling(false) }
  }

  // Doctor must go through the TreatmentWorkflowModal to complete an appointment.
  // This ensures Medical Record, Prescription, and Bill are always created.

  const backPath = isDoctor ? '/doctor/appointments' : isPatient ? '/patient/appointments' : '/admin/appointments'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        <div className="card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !appt) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600 dark:text-slate-300">{error || 'Appointment not found.'}</p>
          <Link to={backPath} className="btn btn-secondary btn-sm">Go back</Link>
        </div>
      </div>
    )
  }

  const statusInfo = appointmentStatusMap[appt.status]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link to={backPath} className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to appointments
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Appointment #{appt.appointmentNumber || appt._id}
              </h1>
              {statusInfo && (
                <span className={statusInfo.class}>{statusInfo.label}</span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {appt.appointmentDate} {appt.appointmentTime && `at ${appt.slot || appt.appointmentTime}`}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Patient */}
          <div className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Patient</p>
            <div className="flex items-center gap-3">
              <Avatar name={appt.patientName} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{appt.patientName}</p>
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Doctor</p>
            <div className="flex items-center gap-3">
              <Avatar name={appt.doctorName} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{appt.doctorName}</p>
                {appt.specialty && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{appt.specialty}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Date & Time</p>
            <div className="space-y-1">
              <p className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                {appt.appointmentDate || '—'}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                {appt.slot || appt.appointmentTime || '—'}
              </p>
            </div>
          </div>

          {/* Hospital */}
          <div className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Hospital</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BuildingOffice2Icon className="w-4 h-4 text-slate-400" />
              {appt.hospitalName || 'Not specified'}
            </p>
          </div>

          {/* Reason */}
          {appt.notes && (
            <div className="sm:col-span-2 p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Reason / Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <ClipboardDocumentListIcon className="w-4 h-4 text-slate-400 inline mr-2" />
                {appt.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border-light dark:border-border-dark">
          {/* Doctor completes via Treatment Workflow (Medical Record → Prescription → Bill) */}
          {isDoctor && appt.status !== 'completed' && appt.status !== 'cancelled' && (
            <Button
              onClick={() => setTreatmentModalOpen(true)}
              icon={<CheckCircleIcon className="w-4 h-4" />}
            >
              Complete Appointment
            </Button>
          )}

          {/* Patient & Doctor can cancel (if not completed) */}
          {appt.status !== 'completed' && appt.status !== 'cancelled' && (
            <Button
              variant="danger"
              loading={cancelling}
              onClick={handleCancel}
              icon={<XCircleIcon className="w-4 h-4" />}
            >
              Cancel Appointment
            </Button>
          )}

          {/* View Generated Bill for Patient when completed */}
          {isPatient && appt.status === 'completed' && (
            <Button
              variant="secondary"
              loading={loadingBill}
              onClick={handleViewBill}
              icon={<BanknotesIcon className="w-4 h-4 text-emerald-600" />}
            >
              View Bill
            </Button>
          )}
        </div>
      </div>

      {/* Treatment Workflow Modal */}
      <TreatmentWorkflowModal
        open={treatmentModalOpen}
        onClose={() => setTreatmentModalOpen(false)}
        appointment={appt}
        doctorId={user?.id}
        onSuccess={() => setAppt(prev => ({ ...prev, status: 'completed', rawStatus: 'COMPLETED' }))}
      />

      {/* Bill Detail Modal */}
      <BillDetailModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        bill={viewingBill}
        patientName={appt?.patientName}
        doctorName={appt?.doctorName}
        onPay={isPatient ? handlePayBill : undefined}
        paying={paying}
      />
    </div>
  )
}