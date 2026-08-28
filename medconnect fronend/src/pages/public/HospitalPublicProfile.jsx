import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon, BuildingOffice2Icon, MapPinIcon,
  PhoneIcon, EnvelopeIcon, UsersIcon, CheckCircleIcon,
  StarIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { hospitalService, doctorService } from '@/api/services'
import { normalizeHospital, normalizeDoctors } from '@/utils/normalizers'
import { Avatar, StarRating } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&h=400&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=400&fit=crop&auto=format',
]

export default function HospitalPublicProfile() {
  const { id } = useParams()
  const { isPatient, isAuthenticated } = useAuth()
  const [hospital, setHospital] = useState(null)
  const [doctors,  setDoctors]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    Promise.allSettled([
      hospitalService.getById(id),
      doctorService.getAll(),
    ]).then(([hRes, dRes]) => {
      if (cancelled) return
      if (hRes.status === 'fulfilled') {
        setHospital(normalizeHospital(hRes.value.data))
      }
      if (dRes.status === 'fulfilled') {
        const all = normalizeDoctors(dRes.value.data || [])
        // Filter doctors belonging to this hospital
        const mine = all.filter(d => String(d.hospitalId) === String(id))
        setDoctors(mine)
      }
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  const heroImg = HERO_IMAGES[Number(id) % HERO_IMAGES.length] || HERO_IMAGES[0]
  const isApproved = hospital?.status === 'APPROVED' || hospital?.status === 'ACTIVE'

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        <div className="h-60 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="card p-6 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />)}
        </div>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Hospital not found.</p>
        <Link to="/hospitals" className="btn btn-primary mt-4">Back to hospitals</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/hospitals" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to hospitals
      </Link>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72">
        <img
          src={heroImg}
          alt={hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <div className="flex items-center gap-3 mb-1">
            {isApproved && (
              <span className="badge-success flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{hospital.name}</h1>
          {hospital.city && (
            <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              {hospital.city}{hospital.state ? `, ${hospital.state}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {hospital.address && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{hospital.address}</p>
                    {hospital.city && <p className="text-xs text-slate-400">{hospital.city}{hospital.state ? `, ${hospital.state}` : ''} {hospital.pincode}</p>}
                  </div>
                </div>
              )}
              {hospital.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-200">{hospital.phone}</p>
                </div>
              )}
              {hospital.email && (
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-200">{hospital.email}</p>
                </div>
              )}
              {hospital.registrationNumber && (
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-200">Reg: {hospital.registrationNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Affiliated doctors */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                Doctors ({doctors.length})
              </h2>
              {doctors.length > 0 && (
                <Link to="/doctors" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  View all doctors
                </Link>
              )}
            </div>
            {doctors.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No doctors listed for this hospital yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {doctors.slice(0, 6).map(doc => (
                  <Link
                    key={doc._id}
                    to={`/doctors/${doc._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                  >
                    <Avatar name={doc.fullName} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {doc.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{doc.specialization || '—'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: stats + CTA */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Quick facts</h2>
            {[
              { label: 'Total doctors',     value: doctors.length, color: 'text-primary-600 dark:text-primary-400' },
              { label: 'Active doctors',    value: doctors.filter(d => d.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Specializations',   value: [...new Set(doctors.map(d => d.specialization).filter(Boolean))].length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Status',            value: hospital.status || 'PENDING', color: isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                <span className={clsx('text-base font-bold', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="card p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto">
              <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Find doctors here</p>
            <p className="text-xs text-slate-400">Browse and book appointments with affiliated doctors</p>
            <Link to="/doctors" className="btn btn-primary btn-sm w-full">
              Browse doctors
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
