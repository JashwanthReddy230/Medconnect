import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

import { useAuth } from '@/context/AuthContext'
import { appointmentService } from '@/api/services'

export default function ContinueAppointment() {
    const navigate = useNavigate()

    const {
        user,
        loading: authLoading,
    } = useAuth()

    const [processing, setProcessing] = useState(true)
    const [appointment, setAppointment] = useState(null)

    useEffect(() => {
        if (authLoading) return

        const continueBooking = async () => {
            // Check login
            if (!user) {
                navigate('/login?redirect=appointment')
                return
            }

            // Only patient can book
            if (user.role !== 'patient') {
                toast.error(
                    'Only patients can book appointments.'
                )

                navigate('/')
                return
            }

            // Get saved appointment
            const storedAppointment =
                sessionStorage.getItem('pendingAppointment')

            if (!storedAppointment) {
                toast.error(
                    'Appointment details were not found.'
                )

                navigate('/patient/doctors')
                return
            }

            try {
                const pending =
                    JSON.parse(storedAppointment)

                const patientId =
                    user.id || user._id

                if (!patientId) {
                    throw new Error(
                        'Patient ID not found.'
                    )
                }

                // Create confirmed appointment
                const payload = {
                    hospitalId:
                        pending.hospitalId,

                    doctorId:
                        pending.doctorId,

                    patientId:
                        patientId,

                    appointmentDate:
                        pending.appointmentDate,

                    appointmentTime:
                        pending.appointmentTime,

                    reason:
                        pending.reason || '',

                    status:
                        'CONFIRMED',

                    remarks:
                        pending.remarks || '',
                }

                console.log(
                    'Creating confirmed appointment:',
                    payload
                )

                const response =
                    await appointmentService.create(
                        payload
                    )

                const createdAppointment =
                    response?.data || response

                // Clear pending booking
                sessionStorage.removeItem(
                    'pendingAppointment'
                )

                // Save created appointment
                setAppointment(
                    createdAppointment
                )

                toast.success(
                    'Appointment confirmed successfully!'
                )

                setProcessing(false)

                // Redirect to My Appointments
                setTimeout(() => {
                    navigate(
                        '/patient/appointments'
                    )
                }, 2000)

            } catch (error) {
                console.error(
                    'Appointment creation failed:',
                    error
                )

                toast.error(
                    error?.response?.data?.message ||
                    'Failed to confirm appointment.'
                )

                setProcessing(false)
            }
        }

        continueBooking()
    }, [
        authLoading,
        user,
        navigate,
    ])

    // Processing screen
    if (
        authLoading ||
        processing
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-surface-dark px-4">
                <div className="card w-full max-w-md p-8 text-center">

                    <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-primary-100 dark:border-primary-900 border-t-primary-600 animate-spin" />

                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Confirming Appointment
                    </h1>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Please wait while we confirm your appointment...
                    </p>

                </div>
            </div>
        )
    }

    // Error screen
    if (!appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-surface-dark px-4">
                <div className="card w-full max-w-md p-8 text-center">

                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Appointment Not Created
                    </h1>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Something went wrong while creating your appointment.
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                '/patient/doctors'
                            )
                        }
                        className="btn btn-primary mt-6"
                    >
                        Find a Doctor
                    </button>

                </div>
            </div>
        )
    }

    // Success screen
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-surface-dark px-4">

            <div className="card w-full max-w-lg p-8 text-center">

                <div className="w-20 h-20 mx-auto rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">

                    <CheckCircleIcon className="w-12 h-12 text-green-500" />

                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-5">
                    Appointment Confirmed!
                </h1>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Your appointment has been successfully confirmed.
                </p>

                {appointment.appointmentNumber && (
                    <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Appointment Number
                        </p>

                        <p className="text-lg font-bold text-primary-700 dark:text-primary-300 mt-1">
                            {appointment.appointmentNumber}
                        </p>

                    </div>
                )}

                <button
                    onClick={() =>
                        navigate(
                            '/patient/appointments'
                        )
                    }
                    className="btn btn-primary mt-6"
                >
                    View My Appointments
                </button>

            </div>

        </div>
    )
}