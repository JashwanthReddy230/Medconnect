import { useState, useEffect, useRef, useCallback } from 'react'
import {
    CheckCircleIcon,
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { authService } from '@/api/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const normalizeMobile = (raw) => {
    return (raw || '').replace(/\D/g, '').slice(-10)
}

const parseError = (err, fallback) => {
    const data = err?.response?.data

    if (typeof data === 'string' && data) {
        return data
    }

    if (data?.message) {
        return data.message
    }

    return fallback
}

export default function MobileOtpVerification({
    phone,
    onVerifiedChange,
    disabled = false,
}) {
    const mobile = normalizeMobile(phone)

    const [isOpen, setIsOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)

    const [otpSent, setOtpSent] = useState(false)
    const [verified, setVerified] = useState(false)

    const [otp, setOtp] = useState('')
    const [cooldown, setCooldown] = useState(0)

    const [verifiedFor, setVerifiedFor] = useState(null)

    const timerRef = useRef(null)

    // ============================================================
    // RESET VERIFICATION WHEN MOBILE NUMBER CHANGES
    // ============================================================

    useEffect(() => {
        if (verifiedFor && verifiedFor !== mobile) {
            setVerified(false)
            setVerifiedFor(null)
            setOtpSent(false)
            setOtp('')
            setCooldown(0)
            setIsOpen(false)

            onVerifiedChange?.(false)
        }
    }, [mobile, verifiedFor, onVerifiedChange])

    // ============================================================
    // OTP COUNTDOWN
    // ============================================================

    useEffect(() => {
        if (cooldown <= 0) {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }

            return
        }

        timerRef.current = setInterval(() => {
            setCooldown((current) => Math.max(0, current - 1))
        }, 1000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [cooldown])

    // ============================================================
    // OPEN POPUP
    // ============================================================

    const openVerificationPopup = () => {
        if (disabled) {
            return
        }

        if (mobile.length !== 10) {
            toast.error('Enter a valid 10-digit mobile number first.')
            return
        }

        setIsOpen(true)
    }

    // ============================================================
    // CLOSE POPUP
    // ============================================================

    const closeVerificationPopup = () => {
        if (sending || verifying) {
            return
        }

        setIsOpen(false)
    }

    // ============================================================
    // SEND OTP
    // ============================================================

    const handleSendOtp = useCallback(
        async (isResend = false) => {
            if (mobile.length !== 10) {
                toast.error('Enter a valid 10-digit mobile number first.')
                return
            }

            setSending(true)

            try {
                const res = await authService.sendOtp(mobile)

                setOtpSent(true)
                setOtp('')
                setCooldown(30)

                toast.success(
                    typeof res.data === 'string'
                        ? res.data
                        : isResend
                            ? 'OTP resent successfully.'
                            : 'OTP sent successfully.'
                )
            } catch (err) {
                toast.error(
                    parseError(
                        err,
                        'Failed to send OTP. Please try again.'
                    )
                )
            } finally {
                setSending(false)
            }
        },
        [mobile]
    )

    // ============================================================
    // VERIFY OTP
    // ============================================================

    const handleVerifyOtp = useCallback(async () => {
        if (otp.length !== 6) {
            toast.error('Enter the 6-digit OTP.')
            return
        }

        setVerifying(true)

        try {
            const res = await authService.verifyOtp(mobile, otp)

            setVerified(true)
            setVerifiedFor(mobile)

            setIsOpen(false)

            onVerifiedChange?.(true)

            toast.success(
                typeof res.data === 'string'
                    ? res.data
                    : 'Mobile number verified successfully!'
            )
        } catch (err) {
            toast.error(
                parseError(
                    err,
                    'Invalid OTP. Please try again.'
                )
            )
        } finally {
            setVerifying(false)
        }
    }, [mobile, otp, onVerifiedChange])

    // ============================================================
    // OTP INPUT
    // ============================================================

    const handleOtpChange = (e) => {
        const value = e.target.value
            .replace(/\D/g, '')
            .slice(0, 6)

        setOtp(value)
    }

    // ============================================================
    // CHANGE NUMBER / SEND OTP AGAIN
    // ============================================================

    const handleChangeMobile = () => {
        setOtpSent(false)
        setOtp('')
        setCooldown(0)
    }

    return (
        <>
            {/* ========================================================
          VERIFY BUTTON
          ALWAYS VISIBLE BESIDE MOBILE NUMBER
         ======================================================== */}

            {verified ? (
                <div
                    className="
            h-10
            px-3
            rounded-lg
            flex
            items-center
            justify-center
            gap-1.5
            whitespace-nowrap
            text-sm
            font-medium
            bg-emerald-50
            text-emerald-700
            border
            border-emerald-200
            dark:bg-emerald-900/20
            dark:text-emerald-300
            dark:border-emerald-800
          "
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    Verified
                </div>
            ) : (
                <button
                    type="button"
                    onClick={openVerificationPopup}
                    disabled={disabled || mobile.length !== 10}
                    className={clsx(
                        'h-10',
                        'px-4',
                        'rounded-lg',
                        'inline-flex',
                        'items-center',
                        'justify-center',
                        'gap-1.5',
                        'whitespace-nowrap',
                        'text-sm',
                        'font-semibold',
                        'border',
                        'transition-all',
                        'duration-150',
                        mobile.length === 10 && !disabled
                            ? [
                                'bg-primary-600',
                                'text-white',
                                'border-primary-600',
                                'hover:bg-primary-700',
                                'hover:border-primary-700',
                                'cursor-pointer',
                                'shadow-sm',
                            ].join(' ')
                            : [
                                'bg-slate-100',
                                'text-slate-400',
                                'border-slate-200',
                                'cursor-not-allowed',
                                'dark:bg-slate-800',
                                'dark:text-slate-500',
                                'dark:border-slate-700',
                            ].join(' ')
                    )}
                >
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                    Verify
                </button>
            )}

            {/* ========================================================
          OTP POPUP
         ======================================================== */}

            {isOpen && (
                <div
                    className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            p-4
          "
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mobile-verification-title"
                >
                    {/* BACKDROP */}

                    <div
                        className="
              absolute
              inset-0
              bg-black/50
              backdrop-blur-sm
            "
                        onClick={closeVerificationPopup}
                    />

                    {/* ====================================================
              MODAL
             ==================================================== */}

                    <div
                        className="
              relative
              w-full
              max-w-md
              overflow-hidden
              rounded-2xl
              bg-white
              dark:bg-card-dark
              border
              border-border-light
              dark:border-border-dark
              shadow-2xl
              animate-fade-in
            "
                    >
                        {/* ==================================================
                HEADER
               ================================================== */}

                        <div
                            className="
                flex
                items-center
                justify-between
                px-6
                py-5
                border-b
                border-border-light
                dark:border-border-dark
              "
                        >
                            <div className="flex items-center gap-3">

                                <div
                                    className="
                    w-10
                    h-10
                    rounded-xl
                    bg-primary-100
                    dark:bg-primary-900/30
                    flex
                    items-center
                    justify-center
                  "
                                >
                                    <ShieldCheckIcon
                                        className="
                      w-6
                      h-6
                      text-primary-600
                      dark:text-primary-400
                    "
                                    />
                                </div>

                                <div>

                                    <h3
                                        id="mobile-verification-title"
                                        className="
                      text-lg
                      font-semibold
                      text-slate-800
                      dark:text-slate-100
                    "
                                    >
                                        Verify Mobile Number
                                    </h3>

                                    <p
                                        className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                      mt-0.5
                    "
                                    >
                                        Verify your number using OTP
                                    </p>

                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeVerificationPopup}
                                disabled={sending || verifying}
                                className="
                  p-2
                  rounded-lg
                  text-slate-400
                  hover:text-slate-600
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                  transition
                "
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                        </div>

                        {/* ==================================================
                BODY
               ================================================== */}

                        <div className="p-6">

                            {/* MOBILE NUMBER */}

                            <div
                                className="
                  mb-5
                  p-4
                  rounded-xl
                  bg-slate-50
                  dark:bg-slate-800/50
                  border
                  border-border-light
                  dark:border-border-dark
                "
                            >
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Mobile number
                                </p>

                                <p
                                    className="
                    mt-1
                    font-semibold
                    text-slate-800
                    dark:text-slate-100
                  "
                                >
                                    +91 {mobile}
                                </p>
                            </div>

                            {/* =================================================
                  SEND OTP SCREEN
                 ================================================= */}

                            {!otpSent ? (
                                <div className="space-y-5">

                                    <div className="text-center py-2">

                                        <div
                                            className="
                        w-14
                        h-14
                        mx-auto
                        rounded-full
                        bg-primary-100
                        dark:bg-primary-900/30
                        flex
                        items-center
                        justify-center
                      "
                                        >
                                            <DevicePhoneMobileIcon
                                                className="
                          w-7
                          h-7
                          text-primary-600
                          dark:text-primary-400
                        "
                                            />
                                        </div>

                                        <h4
                                            className="
                        mt-4
                        font-semibold
                        text-slate-800
                        dark:text-slate-100
                      "
                                        >
                                            Send verification OTP
                                        </h4>

                                        <p
                                            className="
                        mt-1
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                                        >
                                            A 6-digit OTP will be sent to your mobile number.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSendOtp(false)}
                                        disabled={sending}
                                        className="
                      w-full
                      h-11
                      rounded-lg
                      bg-primary-600
                      hover:bg-primary-700
                      text-white
                      font-semibold
                      text-sm
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                                    >
                                        <DevicePhoneMobileIcon className="w-4 h-4" />

                                        {sending
                                            ? 'Sending OTP...'
                                            : 'Send OTP'}
                                    </button>

                                </div>
                            ) : (

                                /* =================================================
                                   OTP SCREEN
                                   ================================================= */

                                <div className="space-y-5">

                                    <div
                                        className="
                      flex
                      items-start
                      gap-2
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                                    >
                                        <ShieldCheckIcon
                                            className="
                        w-5
                        h-5
                        flex-shrink-0
                        text-primary-500
                      "
                                        />

                                        <span>
                                            Enter the 6-digit OTP sent to{' '}

                                            <strong
                                                className="
                          text-slate-700
                          dark:text-slate-200
                        "
                                            >
                                                +91 {mobile}
                                            </strong>
                                        </span>

                                    </div>

                                    {/* OTP INPUT */}

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={otp}
                                        onChange={handleOtpChange}
                                        placeholder="Enter OTP"
                                        autoFocus
                                        disabled={verifying}
                                        className="
                      w-full
                      h-12
                      px-4
                      rounded-xl
                      border
                      border-border-light
                      dark:border-border-dark
                      bg-white
                      dark:bg-card-dark
                      text-slate-800
                      dark:text-white
                      text-center
                      text-lg
                      font-semibold
                      tracking-[0.5em]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-primary-500/40
                      focus:border-primary-500
                    "
                                    />

                                    {/* VERIFY OTP */}

                                    <button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={verifying || otp.length !== 6}
                                        className="
                      w-full
                      h-11
                      rounded-lg
                      bg-primary-600
                      hover:bg-primary-700
                      text-white
                      font-semibold
                      text-sm
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      transition
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />

                                        {verifying
                                            ? 'Verifying...'
                                            : 'Verify Mobile Number'}
                                    </button>

                                    {/* RESEND */}

                                    <div
                                        className="
                      flex
                      items-center
                      justify-between
                      text-xs
                    "
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSendOtp(true)}
                                            disabled={cooldown > 0 || sending}
                                            className={clsx(
                                                'font-medium',
                                                cooldown > 0 || sending
                                                    ? 'text-slate-400 cursor-not-allowed'
                                                    : 'text-primary-600 dark:text-primary-400 hover:underline'
                                            )}
                                        >
                                            {cooldown > 0
                                                ? `Resend OTP in ${cooldown}s`
                                                : 'Resend OTP'}
                                        </button>

                                        <span className="text-slate-400">
                                            Expires in 5 minutes
                                        </span>
                                    </div>

                                    {/* CHANGE NUMBER */}

                                    <button
                                        type="button"
                                        onClick={handleChangeMobile}
                                        className="
                      w-full
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                      hover:text-primary-600
                      dark:hover:text-primary-400
                    "
                                    >
                                        Change mobile number
                                    </button>

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}