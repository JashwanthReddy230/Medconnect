import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
    ArrowLeftIcon,
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    LockClosedIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

import { paymentService } from '@/api/services'

import './paymentmode.css'


export default function PaymentMode() {
    const location = useLocation()
    const navigate = useNavigate()

    /*
     * =========================================================
     * BILL DATA
     *
     * PaymentMode receives the bill from PatientBills.jsx
     *
     * navigate('/patient/payment', {
     *   state: {
     *     bill: bill
     *   }
     * })
     * =========================================================
     */

    const bill = location.state?.bill

    /*
     * =========================================================
     * STATE
     * =========================================================
     */

    const [selectedMethod, setSelectedMethod] =
        useState('')

    const [paying, setPaying] =
        useState(false)

    const [paymentSuccess, setPaymentSuccess] =
        useState(false)

    const [error, setError] =
        useState('')


    /*
     * =========================================================
     * CHECK BILL
     * =========================================================
     */

    useEffect(() => {
        if (!bill) {
            toast.error(
                'Bill information not found.'
            )

            navigate(
                '/patient/bills',
                {
                    replace: true,
                }
            )
        }
    }, [
        bill,
        navigate,
    ])


    /*
     * =========================================================
     * FORMAT AMOUNT
     * =========================================================
     */

    const formatAmount = (amount) => {
        return `₹${Number(
            amount || 0
        ).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
    }


    /*
     * =========================================================
     * PAYMENT METHODS
     * =========================================================
     */

    const paymentMethods = [
        {
            id: 'UPI',
            title: 'UPI',
            description:
                'Google Pay, PhonePe, Paytm and other UPI apps',
            icon: BanknotesIcon,
            iconClass:
                'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },

        {
            id: 'CARD',
            title: 'Debit / Credit Card',
            description:
                'Visa, Mastercard, RuPay and other cards',
            icon: CreditCardIcon,
            iconClass:
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },

        {
            id: 'NETBANKING',
            title: 'Net Banking',
            description:
                'Pay securely using your bank account',
            icon: BuildingLibraryIcon,
            iconClass:
                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
    ]


    /*
     * =========================================================
     * CARD PAYMENT
     *
     * Card payment gets its own page because it requires
     * card details and the card animation.
     * =========================================================
     */

    const handleCardPayment = () => {

        if (!bill?.id) {
            toast.error(
                'Bill information is missing.'
            )

            return
        }

        navigate(
            '/patient/card-payment',
            {
                state: {
                    bill: bill,
                },
            }
        )
    }


    /*
     * =========================================================
     * UPI / NET BANKING PAYMENT
     * =========================================================
     */

    const handlePayment = async () => {

        setError('')

        if (!selectedMethod) {
            setError(
                'Please select a payment method.'
            )

            toast.error(
                'Please select a payment method.'
            )

            return
        }

        /*
         * CARD has its own payment page.
         */

        if (
            selectedMethod ===
            'CARD'
        ) {
            handleCardPayment()
            return
        }

        if (!bill?.id) {
            setError(
                'Bill information is missing.'
            )

            toast.error(
                'Bill information is missing.'
            )

            return
        }

        const amount =
            Number(
                bill.totalAmount || 0
            )

        if (amount <= 0) {
            setError(
                'Invalid bill amount.'
            )

            toast.error(
                'Invalid bill amount.'
            )

            return
        }

        setPaying(true)

        try {

            /*
             * Existing backend payment API.
             *
             * Only send payment information.
             * Do not send card number/CVV.
             */

            await paymentService.create({
                billId:
                    bill.id,

                appointmentId:
                    bill.appointmentId,

                patientId:
                    bill.patientId,

                amount:
                    amount,

                paymentMethod:
                    selectedMethod,
            })

            /*
             * Payment successful
             */

            setPaymentSuccess(true)

            toast.success(
                'Payment completed successfully!'
            )

            /*
             * Give user a short success
             * animation before redirecting.
             */

            setTimeout(() => {

                navigate(
                    '/patient/bills',
                    {
                        replace: true,

                        state: {
                            paymentSuccess:
                                true,

                            paidBillId:
                                bill.id,

                            paidBill: bill,
                        },
                    }
                )

            }, 1800)

        } catch (err) {

            console.error(
                'Payment error:',
                err
            )

            const message =
                err?.response
                    ?.data
                    ?.message ||
                err?.response
                    ?.data
                    ?.error ||
                'Payment failed. Please try again.'

            setError(message)

            toast.error(message)

        } finally {

            setPaying(false)

        }
    }


    /*
     * =========================================================
     * IF BILL IS NOT AVAILABLE
     * =========================================================
     */

    if (!bill) {
        return null
    }


    /*
     * =========================================================
     * SUCCESS SCREEN
     * =========================================================
     */

    if (paymentSuccess) {

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">

                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">

                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">

                        <CheckCircleIcon
                            className="w-9 h-9 text-emerald-600 dark:text-emerald-400"
                        />

                    </div>

                    <h1 className="mt-5 text-xl font-bold text-slate-800 dark:text-white">
                        Payment Successful
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Your payment has been completed successfully.
                    </p>

                    <p className="mt-4 text-xs text-slate-400">
                        Redirecting to your bills...
                    </p>

                </div>

            </div>
        )
    }


    /*
     * =========================================================
     * MAIN PAGE
     * =========================================================
     */

    return (

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

            {/* =====================================================
          HEADER
      ===================================================== */}

            <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">

                    <div className="flex items-center justify-between">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(-1)
                            }
                            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >

                            <ArrowLeftIcon className="w-4 h-4" />

                            Back

                        </button>


                        <div className="flex items-center gap-2">

                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">

                                <LockClosedIcon
                                    className="w-4 h-4 text-white"
                                />

                            </div>

                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                                Secure Payment
                            </span>

                        </div>

                    </div>

                </div>

            </header>


            {/* =====================================================
          CONTENT
      ===================================================== */}

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                <div className="max-w-3xl mx-auto">

                    {/* TITLE */}

                    <div className="text-center mb-8">

                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">

                            Choose Payment Method

                        </h1>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">

                            Select your preferred payment method to pay your bill.

                        </p>

                    </div>


                    {/* =================================================
              BILL SUMMARY
          ================================================= */}

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 mb-6">

                        <div className="flex items-center justify-between gap-4">

                            <div>

                                <p className="text-xs text-slate-400 uppercase tracking-wide">
                                    Bill Number
                                </p>

                                <p className="mt-1 font-semibold text-slate-800 dark:text-white">
                                    {bill.billNumber ||
                                        `BILL${String(
                                            bill.id
                                        ).padStart(
                                            6,
                                            '0'
                                        )}`}
                                </p>

                            </div>


                            <div className="text-right">

                                <p className="text-xs text-slate-400 uppercase tracking-wide">
                                    Amount
                                </p>

                                <p className="mt-1 text-xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatAmount(
                                        bill.totalAmount
                                    )}
                                </p>

                            </div>

                        </div>


                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">

                            <div>

                                <p className="text-xs text-slate-400">
                                    Appointment
                                </p>

                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">
                                    {bill.appointmentId ||
                                        '-'}
                                </p>

                            </div>


                            <div>

                                <p className="text-xs text-slate-400">
                                    Patient
                                </p>

                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">
                                    {bill.patientId ||
                                        '-'}
                                </p>

                            </div>


                            <div>

                                <p className="text-xs text-slate-400">
                                    Payment Status
                                </p>

                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-1">
                                    {bill.paymentStatus ||
                                        'PENDING'}
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
              PAYMENT METHODS
          ================================================= */}

                    <div className="space-y-3">

                        {paymentMethods.map(
                            (method) => {

                                const Icon =
                                    method.icon

                                const selected =
                                    selectedMethod ===
                                    method.id

                                return (

                                    <button
                                        key={
                                            method.id
                                        }
                                        type="button"
                                        disabled={
                                            paying
                                        }
                                        onClick={() =>
                                            setSelectedMethod(
                                                method.id
                                            )
                                        }
                                        className={`
                      w-full
                      p-4
                      sm:p-5
                      rounded-2xl
                      border-2
                      flex
                      items-center
                      gap-4
                      text-left
                      transition-all
                      ${selected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700'
                                            }
                      ${paying
                                                ? 'opacity-60 cursor-not-allowed'
                                                : 'cursor-pointer'
                                            }
                    `}
                                    >

                                        {/* ICON */}

                                        <div
                                            className={`
                        w-12
                        h-12
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        ${method.iconClass}
                      `}
                                        >

                                            <Icon className="w-6 h-6" />

                                        </div>


                                        {/* TEXT */}

                                        <div className="flex-1 min-w-0">

                                            <p className="font-semibold text-slate-800 dark:text-white">

                                                {method.title}

                                            </p>

                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">

                                                {method.description}

                                            </p>

                                        </div>


                                        {/* RADIO */}

                                        <div
                                            className={`
                        w-5
                        h-5
                        rounded-full
                        border-2
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        ${selected
                                                    ? 'border-primary-500'
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }
                      `}
                                        >

                                            {selected && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                            )}

                                        </div>

                                    </button>

                                )
                            }
                        )}

                    </div>


                    {/* =================================================
              ERROR
          ================================================= */}

                    {error && (

                        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-400">

                            {error}

                        </div>

                    )}


                    {/* =================================================
              PAY BUTTON
          ================================================= */}

                    <div className="mt-6">

                        <button
                            type="button"
                            disabled={
                                !selectedMethod ||
                                paying
                            }
                            onClick={
                                handlePayment
                            }
                            className={`
                w-full
                h-12
                rounded-xl
                font-semibold
                text-sm
                flex
                items-center
                justify-center
                gap-2
                transition-all
                ${!selectedMethod ||
                                    paying
                                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20'
                                }
              `}
                        >

                            {paying ? (

                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                                    Processing Payment...

                                </>

                            ) : (

                                <>
                                    {selectedMethod ===
                                        'CARD'
                                        ? 'Continue to Card Payment'
                                        : `Pay ${formatAmount(
                                            bill.totalAmount
                                        )}`}

                                    <span className="text-lg">
                                        →
                                    </span>
                                </>

                            )}

                        </button>

                    </div>


                    {/* =================================================
              SECURITY NOTE
          ================================================= */}

                    <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">

                        <LockClosedIcon className="w-3.5 h-3.5" />

                        Secure encrypted payment

                    </div>


                    <p className="text-center text-[11px] text-slate-400 mt-2">

                        Your payment information is securely processed.

                    </p>

                </div>

            </main>

        </div>
    )
}