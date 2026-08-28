import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
    ArrowLeftIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline'

import toast from 'react-hot-toast'

import {
    paymentService,
} from '@/api/services'

import './cardpayment.css'


function CardFace({
    back = false,
    cardNumber,
    name,
    expiry,
    cvv,
}) {
    return (
        <div
            className={`card-face ${back
                    ? 'card-back'
                    : 'card-front'
                }`}
        >

            {!back ? (
                <>
                    <div className="card-top">

                        <div className="chip">
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <span className="contactless">
                            )))
                        </span>

                        <span className="platinum">
                            PLATINUM
                        </span>

                    </div>

                    <div className="card-number">
                        {cardNumber ||
                            '4535 3453 4534 5435'}
                    </div>

                    <div className="card-bottom">

                        <div>
                            <small>
                                CARDHOLDER NAME
                            </small>

                            <strong>
                                {name ||
                                    'CARDHOLDER'}
                            </strong>
                        </div>

                        <div>
                            <small>
                                EXPIRES
                            </small>

                            <strong>
                                {expiry ||
                                    '12/28'}
                            </strong>
                        </div>

                        <div className="visa">
                            VISA
                        </div>

                    </div>
                </>
            ) : (
                <>
                    <div className="magnetic-strip" />

                    <div className="signature-row">

                        <div className="signature">
                            {name ||
                                'CARDHOLDER'}
                        </div>

                        <div className="cvv">
                            {cvv || '•••'}
                        </div>

                    </div>

                    <p className="back-copy">
                        This card is securely
                        processed through
                        MedConnect's payment
                        system.
                    </p>

                    <div className="back-brand">
                        VISA
                    </div>
                </>
            )}

        </div>
    )
}


function PaymentCard({ form }) {
    const [flipped, setFlipped] =
        useState(false)

    return (
        <div
            className={`card-stage ${flipped
                    ? 'flipped'
                    : ''
                }`}
            onMouseEnter={() =>
                setFlipped(true)
            }
            onMouseLeave={() =>
                setFlipped(false)
            }
        >

            <div className="card-3d">

                <CardFace
                    {...form}
                />

                <CardFace
                    {...form}
                    back
                />

            </div>

        </div>
    )
}


export default function CardPayment() {

    const location =
        useLocation()

    const navigate =
        useNavigate()

    /*
     * Bill is passed from
     * PaymentMode.jsx
     */
    const bill =
        location.state?.bill

    /*
     * If user directly opens
     * /patient/card-payment
     */
    useEffect(() => {

        if (!bill) {
            toast.error(
                'Payment information not found.'
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


    const [form, setForm] =
        useState({
            name: '',
            cardNumber: '',
            expiry: '',
            cvv: '',
        })

    const [status, setStatus] =
        useState('idle')

    const [error, setError] =
        useState('')


    const update = (
        key,
        value
    ) => {

        setForm(
            (old) => ({
                ...old,
                [key]: value,
            })
        )

        setError('')
    }


    /*
     * =========================================
     * CARD NUMBER
     * =========================================
     */

    const handleCardNumber =
        (e) => {

            const raw =
                e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 16)

            const formatted =
                raw
                    .replace(
                        /(.{4})/g,
                        '$1 '
                    )
                    .trim()

            update(
                'cardNumber',
                formatted
            )
        }


    /*
     * =========================================
     * EXPIRY
     * =========================================
     */

    const handleExpiry =
        (e) => {

            let value =
                e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 4)

            if (
                value.length > 2
            ) {
                value =
                    value.slice(0, 2) +
                    '/' +
                    value.slice(2)
            }

            update(
                'expiry',
                value
            )
        }


    /*
     * =========================================
     * CVV
     * =========================================
     */

    const handleCvv =
        (e) => {

            const value =
                e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 3)

            update(
                'cvv',
                value
            )
        }


    /*
     * =========================================
     * VALIDATE CARD
     * =========================================
     */

    const validateCard =
        () => {

            const cardNumber =
                form.cardNumber.replace(
                    /\s/g,
                    ''
                )

            if (
                form.name.trim().length <
                2
            ) {
                return 'Please enter cardholder name.'
            }

            if (
                cardNumber.length !==
                16
            ) {
                return 'Please enter a valid 16-digit card number.'
            }

            if (
                form.expiry.length !==
                5
            ) {
                return 'Please enter a valid expiry date.'
            }

            const [
                month,
                year,
            ] =
                form.expiry.split('/')

            const expiryMonth =
                Number(month)

            if (
                expiryMonth < 1 ||
                expiryMonth > 12
            ) {
                return 'Please enter a valid expiry month.'
            }

            if (
                year.length !== 2
            ) {
                return 'Please enter a valid expiry year.'
            }

            if (
                form.cvv.length !==
                3
            ) {
                return 'Please enter a valid 3-digit CVV.'
            }

            return null
        }


    /*
     * =========================================
     * PAYMENT
     * =========================================
     */

    const submitPayment =
        async () => {

            const validationError =
                validateCard()

            if (
                validationError
            ) {
                setError(
                    validationError
                )

                toast.error(
                    validationError
                )

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

            setStatus(
                'processing'
            )

            setError('')

            try {

                /*
                 * IMPORTANT:
                 *
                 * Do NOT send card number
                 * or CVV to your backend
                 * unless you are using a
                 * PCI-compliant payment
                 * gateway/tokenization system.
                 *
                 * We only send the payment
                 * method and bill details.
                 */

                await paymentService.create({
                    billId:
                        bill.id,

                    appointmentId:
                        bill.appointmentId,

                    patientId:
                        bill.patientId,

                    amount:
                        bill.totalAmount,

                    paymentMethod:
                        'CARD',
                })

                setStatus(
                    'success'
                )

                toast.success(
                    'Payment completed successfully!'
                )

                /*
                 * Return to bills after
                 * showing success state.
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

                }, 2200)

            } catch (err) {

                console.error(
                    'Card payment error:',
                    err
                )

                setStatus(
                    'idle'
                )

                const message =
                    err?.response
                        ?.data
                        ?.message ||
                    'Card payment failed. Please try again.'

                setError(
                    message
                )

                toast.error(
                    message
                )
            }
        }


    if (!bill) {
        return null
    }


    return (

        <main className="card-payment-page">

            {/* =========================================
          HEADER
      ========================================= */}

            <header className="card-payment-topbar">

                <button
                    type="button"
                    className="card-back-button"
                    onClick={() =>
                        navigate(-1)
                    }
                >
                    <ArrowLeftIcon
                        className="w-4 h-4"
                    />

                    Back
                </button>

                <div className="card-payment-brand">

                    <span className="brand-mark">
                        M
                    </span>

                    MEDCONNECT
                    PAYMENT

                </div>

                <div className="secure-header">

                    <LockClosedIcon
                        className="w-4 h-4"
                    />

                    Secure

                </div>

            </header>


            {/* =========================================
          CHECKOUT
      ========================================= */}

            <section className="card-checkout">

                {/* CARD */}

                <div className="card-visual">

                    <PaymentCard
                        form={form}
                    />

                    <div className="card-tip">

                        <CreditCardIcon
                            className="w-4 h-4"
                        />

                        Hover over the card
                        to view the back

                    </div>

                </div>


                {/* FORM */}

                <div className="card-payment-panel">

                    {status ===
                        'processing' ? (

                        <div className="payment-state">

                            <div className="payment-loader" />

                            <h2>
                                Processing Secure
                                Transaction...
                            </h2>

                            <p>
                                Please don't close
                                this window.
                            </p>

                            <div className="secure-processing">

                                <LockClosedIcon
                                    className="w-4 h-4"
                                />

                                Secure payment
                                processing

                            </div>

                        </div>

                    ) : status ===
                        'success' ? (

                        <div className="payment-state">

                            <div className="payment-success-icon">
                                ✓
                            </div>

                            <h2>
                                Payment Successful!
                            </h2>

                            <p>
                                Your payment has
                                been completed
                                successfully.
                            </p>

                            <p className="redirect-text">
                                Redirecting to
                                your bills...
                            </p>

                        </div>

                    ) : (

                        <>

                            <h1>
                                Card Payment
                            </h1>

                            <p className="card-subtitle">
                                Enter your card
                                information to
                                complete your
                                payment.
                            </p>


                            {/* BILL INFO */}

                            <div className="card-bill-summary">

                                <div>

                                    <span>
                                        Bill Number
                                    </span>

                                    <strong>
                                        {bill.billNumber ||
                                            `BILL-${bill.id}`}
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Appointment
                                    </span>

                                    <strong>
                                        {bill.appointmentId ||
                                            '-'}
                                    </strong>

                                </div>

                                <div className="card-total-row">

                                    <span>
                                        Payment Total
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            bill.totalAmount ||
                                            0
                                        ).toFixed(2)}
                                    </strong>

                                </div>

                            </div>


                            {/* CARDHOLDER */}

                            <label>
                                Cardholder Name
                            </label>

                            <input
                                value={
                                    form.name
                                }
                                onChange={(
                                    e
                                ) =>
                                    update(
                                        'name',
                                        e.target.value.toUpperCase()
                                    )
                                }
                                placeholder="CARDHOLDER NAME"
                                autoComplete="cc-name"
                                disabled={
                                    status ===
                                    'processing'
                                }
                            />


                            {/* CARD NUMBER */}

                            <label>
                                Card Number
                            </label>

                            <div className="card-input-brand">

                                <input
                                    value={
                                        form.cardNumber
                                    }
                                    maxLength={19}
                                    onChange={
                                        handleCardNumber
                                    }
                                    placeholder="4535 3453 4534 5435"
                                    inputMode="numeric"
                                    autoComplete="cc-number"
                                    disabled={
                                        status ===
                                        'processing'
                                    }
                                />

                                <span>
                                    VISA
                                </span>

                            </div>


                            {/* EXPIRY + CVV */}

                            <div className="card-form-row">

                                <div>

                                    <label>
                                        Expiry Date
                                    </label>

                                    <input
                                        value={
                                            form.expiry
                                        }
                                        maxLength={5}
                                        onChange={
                                            handleExpiry
                                        }
                                        placeholder="12/28"
                                        inputMode="numeric"
                                        autoComplete="cc-exp"
                                        disabled={
                                            status ===
                                            'processing'
                                        }
                                    />

                                </div>


                                <div>

                                    <label>
                                        CVV / CVC
                                    </label>

                                    <input
                                        value={
                                            form.cvv
                                        }
                                        maxLength={3}
                                        type="password"
                                        onChange={
                                            handleCvv
                                        }
                                        placeholder="•••"
                                        inputMode="numeric"
                                        autoComplete="cc-csc"
                                        disabled={
                                            status ===
                                            'processing'
                                        }
                                    />

                                </div>

                            </div>


                            {/* SECURITY */}

                            <div className="card-secure-note">

                                <span>

                                    <LockClosedIcon
                                        className="w-3.5 h-3.5"
                                    />

                                    Secure encrypted
                                    payment

                                </span>

                                <span>

                                    <ShieldCheckIcon
                                        className="w-3.5 h-3.5"
                                    />

                                    PCI DSS

                                </span>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div className="card-payment-error">
                                    {error}
                                </div>

                            )}


                            {/* PAY BUTTON */}

                            <button
                                type="button"
                                onClick={
                                    submitPayment
                                }
                                disabled={
                                    status ===
                                    'processing'
                                }
                                className="card-pay-button"
                            >

                                PAY ₹
                                {Number(
                                    bill.totalAmount ||
                                    0
                                ).toFixed(2)}

                                <span>
                                    →
                                </span>

                            </button>


                            {/* CANCEL */}

                            <button
                                type="button"
                                className="card-cancel-button"
                                onClick={() =>
                                    navigate(-1)
                                }
                                disabled={
                                    status ===
                                    'processing'
                                }
                            >
                                Cancel
                            </button>

                        </>
                    )}

                </div>

            </section>

        </main>
    )
}