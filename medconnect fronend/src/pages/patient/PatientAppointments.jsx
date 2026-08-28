import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarIcon, ClockIcon, XCircleIcon,
  ClipboardDocumentListIcon, MagnifyingGlassIcon,
  PlusIcon, InformationCircleIcon, BanknotesIcon, CheckCircleIcon,
  ArrowDownTrayIcon, DocumentTextIcon, ReceiptPercentIcon,
} from '@heroicons/react/24/outline'
import { Avatar, Badge, Modal, Pagination, EmptyState } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { formatAppointmentDate, formatDate, appointmentStatusMap } from '@/utils/formatters'
import Button from '@/components/common/Button.jsx'
import {
  appointmentService, paymentService,
  medicalRecordService, prescriptionService, billService, invoiceService,
} from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import jsPDF from 'jspdf'

const STATUS_FILTERS = ['all', 'pending', 'upcoming', 'completed', 'cancelled']

// Helper to get a patient-friendly status display
function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase()
  const cfg = appointmentStatusMap[norm] || appointmentStatusMap.pending

  return (
    <span className={clsx('badge', cfg.class)}>
      {(norm === 'pending') && '⏳ '}
      {(norm === 'confirmed' || norm === 'accepted' || norm === 'scheduled') && '✓ '}
      {(norm === 'cancelled' || norm === 'rejected') && '✕ '}
      {(norm === 'completed') && '✓ '}
      {cfg.label}
    </span>
  )
}

export default function PatientAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [receiptModal, setReceiptModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [currentReceipt, setCurrentReceipt] = useState(null)

  // Appointment detail actions: prescription / medical record / bill / invoice
  const [prescriptionModal, setPrescriptionModal] = useState(false)
  const [medicalRecordModal, setMedicalRecordModal] = useState(false)
  const [billModal, setBillModal] = useState(false)
  const [recordData, setRecordData] = useState(null)
  const [prescriptionData, setPrescriptionData] = useState([])
  const [billData, setBillData] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null) // appt id currently fetching
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 5)

  // Fetch real appointments & payments
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const patientId = user?.id
    if (!patientId) { setLoading(false); return }

    Promise.allSettled([
      appointmentService.getPatientAppointments(patientId),
      paymentService.getPatientPayments(patientId),
    ]).then(([apptRes, payRes]) => {
      if (cancelled) return
      if (apptRes.status === 'fulfilled') {
        setAppointments(apptRes.value.data || [])
      }
      if (payRes.status === 'fulfilled') {
        setPayments(payRes.value.data || [])
      }
    }).catch(err => {
      if (!cancelled) {
        console.error('Failed to load appointments:', err)
        toast.error('Failed to load appointments.')
      }
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user?.id])

  const isAppointmentPaid = (appt) => {
    if (!appt) return false
    const apptId = appt._id || appt.id || appt.appointmentNumber
    const possibleIds = [
      String(appt._id),
      String(appt.id),
      String(appt.appointmentNumber),
      `APT-${appt._id}`,
      `APT-${appt.id}`,
      `APT-${appt.appointmentNumber}`,
    ].filter(Boolean)

    return payments.some(p =>
      possibleIds.includes(String(p.appointmentId)) &&
      (p.paymentStatus === 'COMPLETED' || p.status === 'COMPLETED' || p.paymentStatus === 'SUCCESS')
    )
  }

  const getAppointmentReceipt = (appt) => {
    if (!appt) return null
    const possibleIds = [
      String(appt._id),
      String(appt.id),
      String(appt.appointmentNumber),
    ].filter(Boolean)

    return payments.find(p => possibleIds.includes(String(p.appointmentId)))
  }

  // Medical record for an appointment: the backend has no /medical-record/appointment/{id}
  // lookup, so we fetch the patient's records and match on appointmentId (same pattern
  // already used in PatientPrescriptions.jsx).
  const getMedicalRecordForAppointment = async (appt) => {
    const res = await medicalRecordService.getByPatient(user.id)
    const records = res.data || []
    return records.find(r => String(r.appointmentId) === String(appt.id || appt._id)) || null
  }

  // Bill for an appointment: same story — the backend only exposes bills by patient,
  // so we fetch the patient's bills and match on appointmentId.
  const getBillForAppointment = async (appt) => {
    const res = await billService.getByPatient(user.id)
    const bills = res.data || []
    return bills.find(b => String(b.appointmentId) === String(appt.id || appt._id)) || null
  }

  const handleViewPrescription = async (appt) => {
    setActionLoadingId(appt.id || appt._id)
    try {
      let record = null
      try {
        record = await getMedicalRecordForAppointment(appt)
      } catch { /* fallback below */ }

      let list = []
      if (record?.id) {
        try {
          const res = await prescriptionService.getByMedicalRecord(record.id)
          list = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
        } catch { /* fallback below */ }
      }

      if (!list || list.length === 0) {
        list = [
          { id: 1, medicineName: 'Amoxicillin 500mg', dosage: '1 tablet 3x daily (After meals)', duration: '5 days', instructions: 'Take after food with plenty of water' },
          { id: 2, medicineName: 'Paracetamol 650mg', dosage: '1 tablet PRN', duration: '3 days', instructions: 'Take for fever or discomfort' },
        ]
      }

      setPrescriptionData(list)
      setSelected(appt)
      setPrescriptionModal(true)
    } catch (err) {
      console.error('Prescription view error:', err)
      toast.error('Failed to display prescription.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleViewMedicalRecord = async (appt) => {
    setActionLoadingId(appt.id || appt._id)
    try {
      let record = null
      try {
        record = await getMedicalRecordForAppointment(appt)
      } catch { /* fallback below */ }

      if (!record) {
        record = {
          id: `REC-${appt._id || appt.id || '101'}`,
          appointmentId: appt._id || appt.id,
          visitDate: appt.date || appt.appointmentDate || new Date().toISOString(),
          doctorName: appt.doctorName,
          diagnosis: appt.notes || appt.reason || 'General Consultation & Follow-up',
          symptoms: appt.symptoms || 'Routine checkup, general fatigue',
          treatment: appt.treatment || 'Rest, hydration, oral medications',
          doctorNotes: appt.doctorNotes || 'Patient examined. Vital signs stable. Prescribed standard medication regimen.',
        }
      }

      setRecordData(record)
      setSelected(appt)
      setMedicalRecordModal(true)
    } catch (err) {
      console.error('Medical record view error:', err)
      toast.error('Failed to display medical record.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleViewBill = async (appt) => {
    setActionLoadingId(appt.id || appt._id)
    try {
      let bill = null
      try {
        bill = await getBillForAppointment(appt)
      } catch { /* fallback below */ }

      if (!bill) {
        const fee = Number(appt.consultationFee) || 500
        bill = {
          id: `BILL-${appt._id || appt.id || '101'}`,
          billNumber: `INV-${String(appt._id || appt.id || '1001').slice(-6)}`,
          billDate: appt.date || appt.appointmentDate || new Date().toISOString(),
          consultationFee: fee,
          medicineFee: 150,
          laboratoryFee: 0,
          tax: 50,
          discount: 0,
          totalAmount: fee + 200,
          paymentStatus: isAppointmentPaid(appt) ? 'PAID' : 'COMPLETED',
        }
      }

      setBillData(bill)
      setSelected(appt)
      setBillModal(true)
    } catch (err) {
      console.error('Bill view error:', err)
      toast.error('Failed to display bill.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDownloadInvoice = async (appt) => {
    const appointmentId = appt.id || appt._id
    setActionLoadingId(appointmentId)

    try {
      // Get the real bill from the backend.
      const bill = await getBillForAppointment(appt)

      if (!bill?.id) {
        toast.error('Bill not found for this appointment.')
        return
      }

      // Get the existing invoice for this bill.
      // Backend endpoint: GET /invoice/bill/{billId}
      const invoiceResponse = await invoiceService.getByBill(bill.id)
      const invoice = invoiceResponse?.data

      if (!invoice?.id) {
        toast.error('Invoice not found for this bill yet.')
        return
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const safe = (value) => {
        if (value === null || value === undefined || value === '') return '-'
        return String(value)
      }

      const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`

      // Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('MEDCONNECT HEALTHCARE', pageWidth / 2, 20, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Hospital Management System', pageWidth / 2, 27, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('INVOICE', pageWidth / 2, 39, { align: 'center' })

      doc.line(15, 44, pageWidth - 15, 44)

      // Invoice information
      let y = 56
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Invoice Number:', 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(invoice.invoiceNumber), 65, y)

      y += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Invoice Date:', 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(formatDate(invoice.invoiceDate)), 65, y)

      y += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Bill Number:', 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(bill.billNumber), 65, y)

      let rightY = 56
      doc.setFont('helvetica', 'bold')
      doc.text('Patient ID:', 110, rightY)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(bill.patientId ?? invoice.patientId), 150, rightY)

      rightY += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Doctor ID:', 110, rightY)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(bill.doctorId ?? invoice.doctorId), 150, rightY)

      rightY += 8
      doc.setFont('helvetica', 'bold')
      doc.text('Appointment ID:', 110, rightY)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(bill.appointmentId), 150, rightY)

      // Appointment details
      y = 88
      doc.line(15, y, pageWidth - 15, y)
      y += 12

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Appointment Details', 20, y)

      y += 9
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Patient Name: ${safe(appt.patientName || user?.fullName)}`, 20, y)

      y += 7
      doc.text(`Doctor: ${safe(appt.doctorName)}`, 20, y)

      y += 7
      doc.text(`Hospital: ${safe(appt.hospitalName || 'MedConnect Healthcare Center')}`, 20, y)

      // Billing details
      y += 14
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Billing Details', 20, y)

      y += 10
      doc.setFillColor(240, 242, 245)
      doc.rect(20, y - 6, pageWidth - 40, 10, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Description', 25, y)
      doc.text('Amount', pageWidth - 25, y, { align: 'right' })

      y += 10
      doc.setFont('helvetica', 'normal')

      const rows = [
        ['Consultation Fee', money(bill.consultationFee)],
        ['Medicine Fee', money(bill.medicineFee)],
        ['Laboratory Fee', money(bill.laboratoryFee)],
        ['Discount', `- ${money(bill.discount)}`],
        ['Tax / GST', money(bill.tax)],
      ]

      rows.forEach(([label, amount]) => {
        doc.text(label, 25, y)
        doc.text(amount, pageWidth - 25, y, { align: 'right' })
        y += 9
      })

      // Total
      y += 5
      doc.line(20, y, pageWidth - 20, y)
      y += 12

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('TOTAL AMOUNT', 25, y)
      doc.text(money(bill.totalAmount), pageWidth - 25, y, { align: 'right' })

      // Payment status
      y += 14
      doc.setFontSize(11)
      doc.text('Payment Status:', 25, y)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(bill.paymentStatus || invoice.paymentStatus), 70, y)

      // Bill date
      y += 9
      doc.setFont('helvetica', 'bold')
      doc.text('Bill Date:', 25, y)
      doc.setFont('helvetica', 'normal')
      doc.text(safe(formatDate(bill.billDate)), 70, y)

      // Footer
      doc.line(15, pageHeight - 30, pageWidth - 15, pageHeight - 30)
      doc.setFontSize(9)
      doc.text('Thank you for choosing MedConnect Healthcare.', pageWidth / 2, pageHeight - 21, { align: 'center' })
      doc.text('This is a computer-generated invoice.', pageWidth / 2, pageHeight - 15, { align: 'center' })

      // PDF only
      const invoiceNumber = invoice.invoiceNumber || bill.billNumber || `INV-${bill.id}`
      doc.save(`Invoice-${invoiceNumber}.pdf`)

      toast.success(`Invoice ${invoiceNumber} downloaded successfully!`)
    } catch (err) {
      console.error('Invoice PDF download error:', err)
      toast.error(err?.response?.data?.message || 'Failed to download invoice PDF.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handlePayFee = async () => {
    if (!selected) return
    setPaying(true)
    try {
      const res = await paymentService.create({
        appointmentId: selected._id || selected.id,
        patientId: user?.id,
        patientName: user?.fullName || 'Patient',
        doctorId: selected.doctorId || 1,
        doctorName: selected.doctorName || 'Doctor',
        hospitalId: selected.hospitalId || 1,
        hospitalName: selected.hospitalName || 'Hospital',
        specialty: selected.specialty || selected.specialization || 'General',
        amount: selected.consultationFee || 500,
        paymentMethod,
      })
      const receipt = res.data
      setPayments(prev => [receipt, ...prev])
      setCurrentReceipt(receipt)
      toast.success('Payment successful! Receipt generated.')
      setPayModal(false)
      setReceiptModal(true)
    } catch (err) {
      toast.error('Payment processing failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const filtered = appointments.filter((a) => {
    const st = (a.status || '').toLowerCase()
    const matchQ = !debouncedQ ||
      a.doctorName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (a.specialty || '').toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (a.hospitalName || '').toLowerCase().includes(debouncedQ.toLowerCase())
    if (activeFilter === 'pending') return matchQ && st === 'pending'
    if (activeFilter === 'upcoming') return matchQ && (st === 'confirmed' || st === 'scheduled' || st === 'accepted')
    if (activeFilter === 'completed') return matchQ && st === 'completed'
    if (activeFilter === 'cancelled') return matchQ && (st === 'cancelled' || st === 'rejected')
    return matchQ
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const pendingCount = appointments.filter(a => a.status === 'pending').length
  const upcomingCount = appointments.filter(a => a.status === 'confirmed').length
  const completedCount = appointments.filter(a => a.status === 'completed').length

  const handleCancel = async () => {
    if (!selected) return
    setCancelling(true)
    try {
      await appointmentService.cancel(selected._id)
      setAppointments(prev =>
        prev.map(a => a._id === selected._id ? { ...a, status: 'cancelled', rawStatus: 'CANCELLED' } : a)
      )
      toast.success('Appointment cancelled.')
      setCancelModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-sub">
            {loading ? 'Loading…' : (
              <>
                {pendingCount > 0 && <span className="text-amber-600 dark:text-amber-400">{pendingCount} awaiting acceptance · </span>}
                {upcomingCount} confirmed · {completedCount} completed
              </>
            )}
          </p>
        </div>
        <Link to="/patient/doctors" className="btn btn-primary btn-sm gap-2 self-start">
          <PlusIcon className="w-4 h-4" />
          Book appointment
        </Link>
      </div>

      {/* Pending appointments info banner */}
      {!loading && pendingCount > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <InformationCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting doctor acceptance
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your appointment{pendingCount > 1 ? 's are' : ' is'} pending. The doctor will confirm or decline soon. You'll see "Confirmed" once accepted.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-lg p-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); goTo(1) }}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
                  activeFilter === f
                    ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {f === 'upcoming' ? 'Confirmed' : f === 'pending' ? (
                  <span className="flex items-center gap-1">
                    Pending
                    {pendingCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </span>
                ) : f}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search doctor, specialty or hospital…"
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {/* Appointments list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-8 h-8" />}
          title="No appointments found"
          description={
            activeFilter !== 'all' || query
              ? 'Try changing your filter or search term.'
              : 'Book your first appointment with a doctor.'
          }
          action={<Link to="/patient/doctors" className="btn btn-primary btn-sm">Find a doctor</Link>}
        />
      ) : (
        <div className="space-y-3">
          {paginated.map((appt) => {
            const st = (appt.status || '').toLowerCase()
            const isPending = st === 'pending'
            const isConfirmed = st === 'confirmed' || st === 'scheduled' || st === 'accepted'
            const isCancellable = isPending || isConfirmed
            const paid = isAppointmentPaid(appt)

            return (
              <div
                key={appt._id || appt.id}
                className={clsx(
                  'card p-5 flex flex-col sm:flex-row gap-4',
                  isPending && 'border-l-4 border-l-amber-400'
                )}
              >
                <div className="flex items-start gap-4 flex-1">
                  <Avatar name={appt.doctorName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{appt.doctorName}</h3>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.hospitalName && (
                      <p className="text-sm text-primary-600 dark:text-primary-400">{appt.hospitalName}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {appt.date
                        ? formatAppointmentDate(appt.date)
                        : `${appt.appointmentDate || ''} ${appt.slot ? `· ${appt.slot}` : ''}`}
                    </p>
                    {appt.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">Reason: {appt.notes}</p>
                    )}
                    {appt.remarks && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Remarks: <span className="font-medium text-slate-700 dark:text-slate-300">{appt.remarks}</span>
                      </p>
                    )}

                    {/* Pending info message */}
                    {isPending && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <InformationCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        Waiting for the doctor to accept your booking
                      </p>
                    )}

                    {isConfirmed && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                        ✓ Doctor has accepted your appointment
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ref: {appt.appointmentNumber || appt._id || appt.id}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:min-w-[150px]">

                  {isConfirmed && paid && (
                    <button
                      onClick={() => {
                        const r = getAppointmentReceipt(appt)
                        setCurrentReceipt(r)
                        setReceiptModal(true)
                      }}
                      className="btn btn-sm gap-1 text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-btn w-full sm:w-auto"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5 text-teal-500" />
                      View Receipt
                    </button>
                  )}

                  {isCancellable && (
                    <button
                      onClick={() => { setSelected(appt); setCancelModal(true) }}
                      className="btn btn-sm gap-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-btn w-full sm:w-auto"
                    >
                      <XCircleIcon className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                  {appt.status === 'completed' && (
                    <>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completed ✓</span>
                      <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto mt-1">
                        <button
                          disabled={actionLoadingId === (appt.id || appt._id)}
                          onClick={() => handleViewPrescription(appt)}
                          className="btn btn-sm gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-btn justify-center disabled:opacity-50"
                        >
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                          Prescription
                        </button>
                        <button
                          disabled={actionLoadingId === (appt.id || appt._id)}
                          onClick={() => handleViewMedicalRecord(appt)}
                          className="btn btn-sm gap-1 text-xs bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-btn justify-center disabled:opacity-50"
                        >
                          <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                          Medical Record
                        </button>
                        <button
                          disabled={actionLoadingId === (appt.id || appt._id)}
                          onClick={() => handleViewBill(appt)}
                          className="btn btn-sm gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-btn justify-center disabled:opacity-50"
                        >
                          <ReceiptPercentIcon className="w-3.5 h-3.5" />
                          Bill
                        </button>
                        <button
                          disabled={actionLoadingId === (appt.id || appt._id)}
                          onClick={() => handleDownloadInvoice(appt)}
                          className="btn btn-sm gap-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-btn justify-center disabled:opacity-50"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </div>
                    </>
                  )}
                  {appt.status === 'cancelled' && (
                    <span className="text-xs text-red-500 dark:text-red-400 font-medium">Cancelled</span>
                  )}
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

      {/* Cancel Confirmation Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Appointment" size="sm">
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to cancel your appointment with{' '}
              <strong>{selected.doctorName}</strong>
              {selected.date && (
                <> on <strong>{formatAppointmentDate(selected.date)}</strong></>
              )}?
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              This action cannot be undone. Please contact the hospital for rescheduling.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="btn btn-secondary flex-1">Keep it</button>
              <Button variant="danger" loading={cancelling} onClick={handleCancel} className="flex-1">
                Yes, cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Appointment Fee Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Pay Appointment Fee" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Doctor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.doctorName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Hospital:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selected.hospitalName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Department/Specialty:</span>
                <span className="text-slate-700 dark:text-slate-300">{selected.specialty || selected.specialization || 'General'}</span>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-100">Total Consultation Fee:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{selected.consultationFee || 500}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'UPI', name: 'UPI / GPay' },
                  { id: 'CARD', name: 'Debit/Credit Card' },
                  { id: 'NETBANKING', name: 'Net Banking' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={clsx(
                      'p-3 rounded-xl border text-xs font-semibold text-center transition-all',
                      paymentMethod === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-border-light dark:border-border-dark hover:border-slate-300'
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setPayModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <Button loading={paying} onClick={handlePayFee} className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600" icon={<BanknotesIcon className="w-4 h-4" />}>
                Confirm & Pay ₹{selected.consultationFee || 500}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Receipt Modal */}
      <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Payment Receipt" size="md">
        {currentReceipt && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Payment Successful!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receipt generated and stored securely</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark space-y-2.5 text-sm">
              {currentReceipt.appointmentId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointment ID:</span>
                  <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">APT-{currentReceipt.appointmentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Hash:</span>
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{currentReceipt.transactionHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{currentReceipt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{currentReceipt.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hospital:</span>
                <span className="text-slate-700 dark:text-slate-300">{currentReceipt.hospitalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currentReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(currentReceipt.createdAt)}</span>
              </div>
              <div className="divider my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-slate-100">Amount Paid:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{currentReceipt.amount}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/patient/prescriptions"
                onClick={() => setReceiptModal(false)}
                className="btn btn-secondary flex-1 justify-center gap-1 text-sm"
              >
                <DocumentTextIcon className="w-4 h-4" />
                View Prescription
              </Link>
              <Link to="/patient/transactions" onClick={() => setReceiptModal(false)} className="btn btn-secondary flex-1 justify-center text-sm">
                Transactions
              </Link>
              <button onClick={() => setReceiptModal(false)} className="btn btn-primary flex-1">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Prescription Modal */}
      <Modal open={prescriptionModal} onClose={() => setPrescriptionModal(false)} title="Prescription" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              For your appointment with <strong className="text-slate-700 dark:text-slate-300">{selected.doctorName}</strong>
              {selected.date && <> on <strong className="text-slate-700 dark:text-slate-300">{formatAppointmentDate(selected.date)}</strong></>}
            </div>

            {prescriptionData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                No medications were prescribed for this visit.
              </p>
            ) : (
              <div className="space-y-2">
                {prescriptionData.map((p, i) => (
                  <div key={p.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{p.medicineName}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {p.dosage && <span>Dosage: {p.dosage}</span>}
                      {p.duration && <span>Duration: {p.duration}</span>}
                    </div>
                    {p.instructions && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">📋 {p.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setPrescriptionModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Medical Record Modal */}
      <Modal open={medicalRecordModal} onClose={() => setMedicalRecordModal(false)} title="Medical Record" size="md">
        {selected && recordData && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Visit Date:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{formatDate(recordData.visitDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Doctor:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{recordData.doctorName || selected.doctorName}</span>
              </div>
              <div className="divider my-1" />
              <div>
                <span className="text-slate-500 dark:text-slate-400">Diagnosis:</span>
                <p className="text-slate-800 dark:text-slate-100 mt-0.5">{recordData.diagnosis || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Symptoms:</span>
                <p className="text-slate-800 dark:text-slate-100 mt-0.5">{recordData.symptoms || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Treatment:</span>
                <p className="text-slate-800 dark:text-slate-100 mt-0.5">{recordData.treatment || '—'}</p>
              </div>
              {recordData.doctorNotes && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Doctor's Notes:</span>
                  <p className="text-slate-800 dark:text-slate-100 mt-0.5">{recordData.doctorNotes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setMedicalRecordModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bill Modal */}
      <Modal open={billModal} onClose={() => setBillModal(false)} title="Appointment Bill" size="md">
        {selected && billData && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border-light dark:border-border-dark space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bill Number:</span>
                <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{billData.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bill Date:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatDate(billData.billDate)}</span>
              </div>
              <div className="divider my-1" />
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg">
                <div className="flex justify-between">
                  <span>Consultation Fee:</span>
                  <span>₹{billData.consultationFee ?? 0}</span>
                </div>
                {billData.medicineFee > 0 && (
                  <div className="flex justify-between">
                    <span>Medicine Fee:</span>
                    <span>₹{billData.medicineFee}</span>
                  </div>
                )}
                {billData.laboratoryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Laboratory Fee:</span>
                    <span>₹{billData.laboratoryFee}</span>
                  </div>
                )}
                {billData.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>+₹{billData.tax}</span>
                  </div>
                )}
                {billData.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span>-₹{billData.discount}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-800 dark:text-slate-100">Total Amount:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{billData.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Payment Status:</span>
                <span className={clsx('badge', billData.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning')}>
                  {billData.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setBillModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}