import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  StarIcon, MapPinIcon, ClockIcon, LanguageIcon,
  ShieldCheckIcon, CalendarIcon, CurrencyDollarIcon,
  ArrowLeftIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { appointmentService, doctorService } from '@/api/services'
import { Avatar, StarRating, Modal } from '@/components/common/index.jsx'
import { normalizeDoctor } from '@/utils/normalizers'
import Button from '@/components/common/Button.jsx'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS_AHEAD = 7
const SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM']

function generateSlotDates() {
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return {
      date: d,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      slots: SLOTS,
    }
  })
}

const SLOT_DATES = generateSlotDates()

export default function DoctorPublicProfile() {
  const { id } = useParams()
  const { isAuthenticated, isPatient } = useAuth()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookModal, setBookModal] = useState(false)
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    doctorService.getById(id)
      .then(res => {
        setDoctor(normalizeDoctor(res.data))
      })
      .catch(err => {
        toast.error('Failed to load doctor profile.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const dayData = SLOT_DATES[selectedDate]

  const handleBook = async () => {
    if (!selectedSlot) { toast.error('Please select a time slot.'); return }
    if (!isAuthenticated) {
      // Guest booking: persist the selected doctor/date/slot so it survives the
      // trip to /login, then resume automatically once login succeeds.
      try {
        localStorage.setItem('mc_pending_booking', JSON.stringify({
          doctorId: doctor.id,
          hospitalId: doctor.hospitalId || 1,
          date: dayData.date.toISOString(),
          slot: selectedSlot,
          notes: 'General checkup via public profile booking',
          doctorName: doctor.fullName,
        }))
      } catch {
        // localStorage unavailable (e.g. private browsing) — booking simply
        // won't auto-resume after login; the person can book again manually.
      }
      toast('Please sign in to complete your booking.', { icon: 'ℹ️' })
      navigate('/login')
      return
    }
    if (!isPatient) { toast.error('Only patients can book appointments.'); return }
    setBookModal(true)
  }

  const confirmBooking = async () => {
    if (!doctor) return
    setBooking(true)
    try {
      await appointmentService.book({
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId || 1,
        date: dayData.date.toISOString(),
        slot: selectedSlot,
        notes: 'General checkup via public profile booking',
      })
      setBooked(true)
      toast.success('Appointment booked successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        <div className="card p-6 flex gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Doctor profile not found.</p>
        <Link to="/doctors" className="btn btn-primary mt-4">Back to list</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back */}
      <Link to={isPatient ? "/patient/doctors" : "/doctors"} className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to doctors
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Doctor info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <Avatar name={doctor.fullName} size="2xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{doctor.fullName}</h1>
                {doctor.status === 'ACTIVE' && (
                  <span className="badge-success flex items-center gap-1">
                    <ShieldCheckIcon className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-primary-600 dark:text-primary-400 font-medium text-lg mb-2">{doctor.specialization}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                {doctor.experience != null && <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" />{doctor.experience} yrs exp</span>}
                {doctor.city && <span className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" />{doctor.city}</span>}
                {doctor.mobile && <span className="flex items-center gap-1.5"><LanguageIcon className="w-4 h-4" />{doctor.mobile}</span>}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-xs text-slate-400">Consultation</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">₹{doctor.consultationFee}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">About</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {doctor.bio || `Dr. ${doctor.fullName} is a dedicated ${doctor.specialization || 'medical professional'} offering online and in-person consultations. Safe, secure, and personalized treatment plans.`}
            </p>
          </div>

          {/* Extra Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Education & Qualification</h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• {doctor.qualification || 'MBBS or equivalent medical degree'}</li>
                <li>• Residency in {doctor.specialization || 'general practice'}</li>
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">License & Registration</h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• License ID: {doctor.licenseNumber || 'Verified Registration'}</li>
                <li>• Status: {doctor.status || 'ACTIVE'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Booking Widget */}
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-400" /> Book appointment
            </h2>

            {/* Date tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {SLOT_DATES.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedDate(idx); setSelectedSlot(null) }}
                  className={clsx(
                    'flex flex-col items-center p-2 rounded-xl border text-center transition-all min-w-[70px]',
                    selectedDate === idx
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">{day.label.split(',')[0]}</span>
                  <span className="text-sm font-bold mt-0.5">{day.label.split(' ')[2] || day.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            {/* Slots grid */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Available slots</p>
              {dayData.slots.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No available slots for this day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {dayData.slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={clsx(
                        'py-2 px-1 text-xs font-medium rounded-xl border text-center transition-all',
                        selectedSlot === slot
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleBook} className="w-full">
              Book now
            </Button>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      <Modal open={bookModal} onClose={() => setBookModal(false)} title="Confirm Booking">
        {booked ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Booking Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">Your appointment with {doctor.fullName} is scheduled.</p>
            </div>
            <div className="p-3 bg-muted-light dark:bg-muted-dark rounded-xl text-left text-xs space-y-1.5">
              <p><strong>Doctor:</strong> {doctor.fullName}</p>
              <p><strong>Date:</strong> {formatDate(dayData.date)}</p>
              <p><strong>Time:</strong> {selectedSlot}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setBookModal(false); navigate('/patient/appointments') }} className="btn btn-primary btn-sm">
                View appointments
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-350">
              You are about to book a consultation with <strong>{doctor.fullName}</strong>.
            </p>
            <div className="p-3 bg-muted-light dark:bg-muted-dark rounded-xl text-xs space-y-1.5">
              <p><strong>Specialization:</strong> {doctor.specialization}</p>
              <p><strong>Date:</strong> {formatDate(dayData.date)}</p>
              <p><strong>Time:</strong> {selectedSlot}</p>
              <p><strong>Fee:</strong> ₹{doctor.consultationFee}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBookModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <Button loading={booking} onClick={confirmBooking} size="sm">Confirm & Book</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}