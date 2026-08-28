import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline'
import { doctorService } from '@/api/services'
import { Avatar, StarRating, Badge, Pagination, Skeleton } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { useAuth } from '@/context/AuthContext'
import { normalizeDoctors } from '@/utils/normalizers'
import clsx from 'clsx'

const SPECIALTIES = [
  '', 'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Gynecologist', 'Oncologist',
  'ENT Specialist', 'Ophthalmologist', 'Dentist',
].map((v) => ({ value: v, label: v || 'All specialties' }))

function DoctorCard({ doctor }) {
  const { user } = useAuth()
  const bookPath = user?.role === 'patient'
    ? `/patient/doctors/${doctor._id}`
    : `/doctors/${doctor._id}`

  return (
    <div className="card-hover p-5 flex flex-col sm:flex-row gap-4 animate-fade-in">
      <div className="flex items-start gap-4 flex-1">
        <div className="relative flex-shrink-0">
          <Avatar name={doctor.fullName} size="xl" />
          {doctor.isAvailableToday && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-card-dark" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{doctor.fullName}</h3>
            {doctor.isAvailableToday && (
              <span className="badge-success text-[10px]">Available today</span>
            )}
          </div>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">
            {doctor.specialization || '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {doctor.experience != null ? `${doctor.experience} years experience` : 'Experience not specified'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {doctor.ratings != null ? (
              <div className="flex items-center gap-1">
                <StarRating rating={doctor.ratings} size="sm" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {doctor.ratings} ({doctor.reviewCount || 0} reviews)
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">No ratings yet</span>
            )}
            {doctor.city && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPinIcon className="w-3 h-3" />
                {doctor.city}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[120px]">
        <div className="text-right">
          <p className="text-xs text-slate-400">Consultation</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">
            {doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
          </p>
        </div>
        <Link to={bookPath} className="btn btn-primary btn-sm whitespace-nowrap">
          Book now
        </Link>
      </div>
    </div>
  )
}

export default function DoctorListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allDoctors, setAllDoctors]   = useState([])
  const [loading,    setLoading]      = useState(true)
  const [error,      setError]        = useState(null)
  const [query,      setQuery]        = useState(searchParams.get('q') || '')
  const [specialty,  setSpecialty]    = useState(searchParams.get('specialty') || '')
  const [sortBy,     setSortBy]       = useState('name')
  const debouncedQ = useDebounce(query, 400)
  const { page, limit, goTo, changeLimit } = usePagination(1, 10)

  // Fetch all doctors on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    doctorService.getAll()
      .then(res => {
        if (!cancelled) {
          setAllDoctors(normalizeDoctors(res.data || []))
        }
      })
      .catch(err => {
        if (!cancelled) setError('Failed to load doctors. Please try again.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Client-side filter + sort
  const filtered = allDoctors.filter(d => {
    const matchQ = !debouncedQ || (
      d.fullName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      (d.specialization || '').toLowerCase().includes(debouncedQ.toLowerCase())
    )
    const matchSpec = !specialty || d.specialization === specialty
    return matchQ && matchSpec
  }).sort((a, b) => {
    if (sortBy === 'fee_asc') return (a.consultationFee ?? 9999) - (b.consultationFee ?? 9999)
    if (sortBy === 'fee_desc') return (b.consultationFee ?? 0) - (a.consultationFee ?? 0)
    if (sortBy === 'rating') return (b.ratings ?? 0) - (a.ratings ?? 0)
    return a.fullName.localeCompare(b.fullName)
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Find a Doctor</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {loading ? 'Loading doctors…' : `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); goTo(1) }}
              placeholder="Search by name or specialty…"
              className="input pl-9"
            />
          </div>
          {/* Specialty */}
          <div className="sm:w-52">
            <Select
              value={specialty}
              onChange={(e) => { setSpecialty(e.target.value); goTo(1) }}
              options={SPECIALTIES}
            />
          </div>
          {/* Sort */}
          <div className="sm:w-44">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'name',     label: 'Sort: Name' },
                { value: 'rating',   label: 'Sort: Rating' },
                { value: 'fee_asc',  label: 'Sort: Fee ↑' },
                { value: 'fee_desc', label: 'Sort: Fee ↓' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm mt-3">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="card p-12 text-center">
          <MagnifyingGlassIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No doctors found</h3>
          <p className="text-sm text-slate-400">Try adjusting your filters or search term.</p>
          {(query || specialty) && (
            <button
              onClick={() => { setQuery(''); setSpecialty(''); goTo(1) }}
              className="btn btn-secondary btn-sm mt-3"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}

      {!loading && !error && paginated.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={goTo}
          pageSize={limit}
          onPageSizeChange={changeLimit}
          total={filtered.length}
        />
      )}
    </div>
  )
}
