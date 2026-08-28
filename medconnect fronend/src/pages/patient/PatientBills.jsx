import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import {
  BanknotesIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import { useAuth } from '@/context/AuthContext'
import {
  billService,
  paymentService,
  invoiceService,
} from '@/api/services'
import {
  EmptyState,
  StatCard,
  InputField,
} from '@/components/common/index.jsx'
import BillDetailModal from '@/components/common/BillDetailModal.jsx'
import Button from '@/components/common/Button.jsx'
import ReviewModal from '@/components/common/ReviewModal.jsx'
import { formatDate, formatCurrency } from '@/utils/formatters'

export default function PatientBills() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)

  // Review modal trigger post-payment
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [paidBillContext, setPaidBillContext] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [selectedBill, setSelectedBill] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const patientId = user?.id || user?._id

  // =========================================================
  // LOAD PATIENT BILLS
  // =========================================================

  const loadBills = useCallback(async () => {
    if (!patientId) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const res = await billService.getByPatient(patientId)

      setBills(
        Array.isArray(res.data)
          ? res.data
          : []
      )
    } catch (err) {
      console.error('Failed to load bills:', err)

      toast.error('Failed to load your bills.')

      setBills([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  useEffect(() => {
    if (location.state?.paymentSuccess) {
      toast.success('Payment completed successfully.')
      if (location.state?.paidBill) {
        setPaidBillContext(location.state.paidBill)
        setReviewModalOpen(true)
      }
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  // =========================================================
  // OPEN BILL FROM NOTIFICATION
  // =========================================================

  useEffect(() => {
    const appointmentId =
      searchParams.get('appointmentId')

    const billId =
      searchParams.get('billId')

    if (!appointmentId && !billId) {
      return
    }

    const openLinkedBill = async () => {
      try {
        const res = billId
          ? await billService.getById(billId)
          : await billService.getByAppointment(
            appointmentId
          )

        if (res.data) {
          setSelectedBill(res.data)
          setIsModalOpen(true)
        } else {
          toast.error(
            'Could not find the bill for that appointment.'
          )
        }
      } catch (err) {
        console.error(
          'Failed to load linked bill:',
          err
        )

        toast.error(
          'Could not find the bill for that appointment.'
        )
      }
    }

    openLinkedBill()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // =========================================================
  // PAY BILL
  // =========================================================

  const openPaymentMode = (bill) => {
    navigate('/patient/payment', {
      state: {
        bill,
      },
    })
  }

  // =========================================================
  // DOWNLOAD INVOICE AS PDF ONLY
  // =========================================================

  const handleDownloadInvoice = async (bill) => {
    if (!bill?.id) {
      toast.error('Invalid bill.')
      return
    }

    setDownloadingInvoice(bill.id)

    try {
      // Fetch the actual invoice from backend
      const res =
        await invoiceService.getByBill(bill.id)

      const invoice = res?.data

      if (!invoice) {
        toast.error(
          'Invoice not found for this bill yet.'
        )
        return
      }

      // =====================================================
      // CREATE PDF
      // =====================================================

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth =
        doc.internal.pageSize.getWidth()

      const pageHeight =
        doc.internal.pageSize.getHeight()

      // -----------------------------------------------------
      // HELPER FUNCTIONS
      // -----------------------------------------------------

      const money = (value) => {
        const amount = Number(value || 0)

        return `Rs. ${amount.toFixed(2)}`
      }

      const safeText = (value) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return '-'
        }

        return String(value)
      }

      const invoiceNumber =
        invoice.invoiceNumber ||
        `INV-${invoice.id || bill.id}`

      // =====================================================
      // HEADER
      // =====================================================

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)

      doc.text(
        'MEDCONNECT HEALTHCARE',
        pageWidth / 2,
        22,
        {
          align: 'center',
        }
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      doc.text(
        'Hospital Management System',
        pageWidth / 2,
        29,
        {
          align: 'center',
        }
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)

      doc.text(
        'INVOICE',
        pageWidth / 2,
        40,
        {
          align: 'center',
        }
      )

      doc.line(
        15,
        45,
        pageWidth - 15,
        45
      )

      // =====================================================
      // INVOICE INFORMATION
      // =====================================================

      doc.setFontSize(10)

      let y = 58

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Invoice Number:',
        20,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        safeText(invoice.invoiceNumber),
        65,
        y
      )

      y += 8

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Invoice Date:',
        20,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        formatDate(invoice.invoiceDate),
        65,
        y
      )

      y += 8

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Bill Number:',
        20,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        safeText(bill.billNumber),
        65,
        y
      )

      // =====================================================
      // PATIENT / APPOINTMENT DETAILS
      // =====================================================

      y = 58

      const rightLabelX = 110
      const rightValueX = 150

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Patient ID:',
        rightLabelX,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        safeText(
          invoice.patientId ??
          bill.patientId
        ),
        rightValueX,
        y
      )

      y += 8

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Doctor ID:',
        rightLabelX,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        safeText(
          invoice.doctorId ??
          bill.doctorId
        ),
        rightValueX,
        y
      )

      y += 8

      doc.setFont('helvetica', 'bold')
      doc.text(
        'Appointment ID:',
        rightLabelX,
        y
      )

      doc.setFont('helvetica', 'normal')
      doc.text(
        safeText(
          bill.appointmentId
        ),
        rightValueX,
        y
      )

      // =====================================================
      // BILLING DETAILS
      // =====================================================

      y = 91

      doc.line(
        15,
        y,
        pageWidth - 15,
        y
      )

      y += 12

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)

      doc.text(
        'Billing Details',
        20,
        y
      )

      y += 10

      doc.setFontSize(10)

      // Table header
      doc.setFillColor(
        240,
        242,
        245
      )

      doc.rect(
        20,
        y - 6,
        pageWidth - 40,
        10,
        'F'
      )

      doc.setFont('helvetica', 'bold')

      doc.text(
        'Description',
        25,
        y
      )

      doc.text(
        'Amount',
        pageWidth - 25,
        y,
        {
          align: 'right',
        }
      )

      y += 10

      doc.setFont('helvetica', 'normal')

      const billingRows = [
        [
          'Consultation Fee',
          money(bill.consultationFee),
        ],
        [
          'Medicine Fee',
          money(bill.medicineFee),
        ],
        [
          'Laboratory Fee',
          money(bill.laboratoryFee),
        ],
        [
          'Discount',
          money(bill.discount),
        ],
        [
          'Tax / GST',
          money(bill.tax),
        ],
      ]

      billingRows.forEach(
        ([label, amount]) => {
          doc.text(
            label,
            25,
            y
          )

          doc.text(
            amount,
            pageWidth - 25,
            y,
            {
              align: 'right',
            }
          )

          y += 9

          doc.setDrawColor(
            220,
            220,
            220
          )

          doc.line(
            20,
            y - 4,
            pageWidth - 20,
            y - 4
          )
        }
      )

      // =====================================================
      // TOTAL
      // =====================================================

      y += 5

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)

      doc.text(
        'TOTAL AMOUNT',
        25,
        y
      )

      doc.text(
        money(
          invoice.amount ??
          bill.totalAmount
        ),
        pageWidth - 25,
        y,
        {
          align: 'right',
        }
      )

      // =====================================================
      // PAYMENT STATUS
      // =====================================================

      y += 14

      doc.setFontSize(11)

      doc.text(
        'Payment Status:',
        25,
        y
      )

      doc.setFont('helvetica', 'normal')

      doc.text(
        safeText(
          invoice.paymentStatus ??
          bill.paymentStatus
        ),
        65,
        y
      )

      // =====================================================
      // BILL DATE
      // =====================================================

      y += 9

      doc.setFont('helvetica', 'bold')

      doc.text(
        'Bill Date:',
        25,
        y
      )

      doc.setFont('helvetica', 'normal')

      doc.text(
        formatDate(bill.billDate),
        65,
        y
      )

      // =====================================================
      // FOOTER
      // =====================================================

      doc.line(
        15,
        pageHeight - 30,
        pageWidth - 15,
        pageHeight - 30
      )

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      doc.text(
        'Thank you for choosing MedConnect Healthcare.',
        pageWidth / 2,
        pageHeight - 21,
        {
          align: 'center',
        }
      )

      doc.text(
        'This is a computer-generated invoice.',
        pageWidth / 2,
        pageHeight - 15,
        {
          align: 'center',
        }
      )

      // =====================================================
      // DOWNLOAD PDF
      // =====================================================

      doc.save(
        `Invoice-${invoiceNumber}.pdf`
      )

      toast.success(
        `Invoice ${invoiceNumber} downloaded successfully!`
      )

    } catch (err) {
      console.error(
        'Invoice PDF download error:',
        err
      )

      toast.error(
        err?.response?.data?.message ||
        'Failed to download invoice PDF.'
      )
    } finally {
      setDownloadingInvoice(null)
    }
  }

  // =========================================================
  // FILTER BILLS
  // =========================================================

  const filteredBills = bills.filter(
    (b) => {
      const q =
        searchQuery.toLowerCase()

      const matchSearch =
        !q ||
        (b.billNumber || '')
          .toLowerCase()
          .includes(q) ||
        String(
          b.appointmentId || ''
        ).includes(q)

      const st =
        (
          b.paymentStatus || ''
        ).toLowerCase()

      if (
        filterStatus === 'paid'
      ) {
        return (
          matchSearch &&
          st === 'paid'
        )
      }

      if (
        filterStatus === 'pending'
      ) {
        return (
          matchSearch &&
          st === 'pending'
        )
      }

      return matchSearch
    }
  )

  // =========================================================
  // STATISTICS
  // =========================================================

  const paidBills = bills.filter(
    (b) =>
      (
        b.paymentStatus || ''
      ).toUpperCase() === 'PAID'
  )

  const pendingBills = bills.filter(
    (b) =>
      (
        b.paymentStatus || ''
      ).toUpperCase() === 'PENDING'
  )

  const totalAmount =
    bills.reduce(
      (sum, b) =>
        sum +
        (
          Number(
            b.totalAmount
          ) || 0
        ),
      0
    )

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6 animate-fade-in">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div>
          <h1 className="page-title">
            Bills & Invoices
          </h1>

          <p className="page-sub">
            Manage consultation fees,
            hospital invoices, and
            transaction receipts.
          </p>
        </div>

        <Link
          to="/patient/transactions"
          className="btn btn-secondary btn-sm gap-2"
        >
          <CreditCardIcon className="w-4 h-4" />

          Transaction History
        </Link>

      </div>

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <StatCard
          title="Total Billed"
          value={
            loading
              ? '…'
              : formatCurrency(
                totalAmount
              )
          }
          icon={<BanknotesIcon />}
          color="info"
        />

        <StatCard
          title="Pending Payments"
          value={
            loading
              ? '…'
              : pendingBills.length
          }
          icon={<ClockIcon />}
          color="warning"
        />

        <StatCard
          title="Paid Bills"
          value={
            loading
              ? '…'
              : paidBills.length
          }
          icon={<CheckCircleIcon />}
          color="success"
        />

      </div>

      {/* =====================================================
          SEARCH + FILTER
      ====================================================== */}

      <div className="card p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">

        <div className="w-full sm:max-w-md relative">

          <InputField
            type="search"
            placeholder="Search by bill number or appointment ID..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
          />

        </div>

        <div className="flex gap-2">

          {[
            'all',
            'pending',
            'paid',
          ].map((st) => (

            <button
              key={st}
              onClick={() =>
                setFilterStatus(st)
              }
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',

                filterStatus === st
                  ? 'bg-primary-500 text-white dark:bg-primary-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              )}
            >
              {st}
            </button>

          ))}

        </div>

      </div>

      {/* =====================================================
          BILLS TABLE
      ====================================================== */}

      <div className="card p-6">

        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
          Itemized Billing Statements
        </h2>

        {loading ? (

          <div className="space-y-3">

            {[...Array(3)].map(
              (_, i) => (

                <div
                  key={i}
                  className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
                />

              )
            )}

          </div>

        ) : filteredBills.length === 0 ? (

          <EmptyState
            icon={
              <DocumentTextIcon className="w-8 h-8" />
            }
            title="No billing statements found"
            description="No bills matched your current search or filter query."
          />

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>

                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-semibold uppercase">

                  <th className="py-3 px-4">
                    Bill #
                  </th>

                  <th className="py-3 px-4">
                    Appointment
                  </th>

                  <th className="py-3 px-4">
                    Date
                  </th>

                  <th className="py-3 px-4">
                    Amount
                  </th>

                  <th className="py-3 px-4">
                    Status
                  </th>

                  <th className="py-3 px-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">

                {filteredBills.map(
                  (bill) => {

                    const isPaid =
                      (
                        bill.paymentStatus ||
                        ''
                      ).toUpperCase() ===
                      'PAID'

                    const isDownloading =
                      downloadingInvoice ===
                      bill.id

                    return (

                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >

                        <td className="py-3 px-4 font-mono font-semibold text-primary-600 dark:text-primary-400">
                          {bill.billNumber}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          #{bill.appointmentId}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {formatDate(
                            bill.billDate
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {formatCurrency(
                            bill.totalAmount
                          )}
                        </td>

                        <td className="py-3 px-4">

                          <span
                            className={`badge ${isPaid
                              ? 'badge-success'
                              : 'badge-warning'
                              }`}
                          >
                            {isPaid
                              ? 'Paid'
                              : 'Pending'}
                          </span>

                        </td>

                        <td className="py-3 px-4 text-right">

                          <div className="flex justify-end gap-2">

                            {/* VIEW BILL */}

                            <button
                              onClick={() => {
                                setSelectedBill(
                                  bill
                                )
                                setIsModalOpen(
                                  true
                                )
                              }}
                              className="btn btn-ghost btn-xs gap-1 text-slate-600 dark:text-slate-300"
                              title="View bill details"
                            >

                              <EyeIcon className="w-3.5 h-3.5" />

                              Details

                            </button>

                            {/* INVOICE / PAYMENT */}

                            {isPaid ? (

                              <button
                                type="button"
                                disabled={
                                  isDownloading
                                }
                                onClick={() =>
                                  handleDownloadInvoice(
                                    bill
                                  )
                                }
                                className="btn btn-secondary btn-xs gap-1 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download invoice PDF"
                              >

                                <ArrowDownTrayIcon className="w-3.5 h-3.5" />

                                {isDownloading
                                  ? 'Downloading...'
                                  : 'Invoice PDF'}

                              </button>

                            ) : (

                              <Button
                                variant="primary"
                                size="xs"
                                loading={paying}
                                onClick={() =>
                                  openPaymentMode(bill)
                                }
                              >
                                Pay Now
                              </Button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          BILL DETAIL MODAL
      ====================================================== */}

      <BillDetailModal
        open={isModalOpen}
        onClose={() =>
          setIsModalOpen(false)
        }
        bill={selectedBill}
        onPay={openPaymentMode}
        paying={false}
      />

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        reviewerId={patientId}
        reviewerRole="USER"
        doctorInfo={{ id: paidBillContext?.doctorId, name: paidBillContext?.doctorName }}
        hospitalInfo={{ id: paidBillContext?.hospitalId, name: paidBillContext?.hospitalName }}
        appointmentId={paidBillContext?.appointmentId}
        paymentId={paidBillContext?.id}
      />

    </div>
  )
}