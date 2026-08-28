import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  MagnifyingGlassIcon, BuildingOffice2Icon,
  MapPinIcon, PhoneIcon, EnvelopeIcon, CheckCircleIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { hospitalService } from '@/api/services'
import { normalizeHospitals } from '@/utils/normalizers'
import { Pagination } from '@/components/common/index.jsx'
import { usePagination, useDebounce } from '@/hooks/index.js'
import clsx from 'clsx'

const HOSPITAL_IMAGES = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=200&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=200&fit=crop&auto=format',
]

function HospitalCard({ hospital, index }) {
  const imgSrc = HOSPITAL_IMAGES[index % HOSPITAL_IMAGES.length]
  const isApproved = hospital.status === 'APPROVED' || hospital.status === 'ACTIVE'

  return (
    <div className="card overflow-hidden card-hover flex flex-col animate-fade-in">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/10 overflow-hidden">
        <img
          src={imgSrc}
          alt={hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        {isApproved && (
          <div className="absolute top-3 right-3">
            <span className="badge-success flex items-center gap-1 text-[10px]">
              <CheckCircleIcon className="w-3 h-3" /> Verified
            </span>
          </div>
        )}
        {!isApproved && (
          <div className="absolute top-3 right-3">
            <span className="badge-warning text-[10px]">{hospital.status}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
            <BuildingOffice2Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {hospital.name}
            </h3>
            {hospital.registrationNumber && (
              <p className="text-xs text-slate-400 mt-0.5">Reg: {hospital.registrationNumber}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {hospital.city && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span>{hospital.city}{hospital.state ? `, ${hospital.state}` : ''}</span>
            </div>
          )}
          {hospital.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{hospital.phone}</span>
            </div>
          )}
          {hospital.email && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-w-0">
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{hospital.email}</span>
            </div>
          )}
        </div>

        <Link
          to={`/hospitals/${hospital.id}`}
          className="btn btn-primary btn-sm mt-4 gap-2"
        >
          View hospital
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default function HospitalListingPage() {
  const [searchParams] = useSearchParams()
  const [allHospitals, setAllHospitals] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [query,        setQuery]        = useState(searchParams.get('q') || '')
  const debouncedQ = useDebounce(query, 400)
  const { page, limit, goTo, changeLimit } = usePagination(1, 9)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    hospitalService.getAll()
      .then(res => {
        if (!cancelled) setAllHospitals(normalizeHospitals(res.data || []))
      })
      .catch(() => { if (!cancelled) setError('Failed to load hospitals. Please try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = allHospitals.filter(h => {
    if (!debouncedQ) return true
    const q = debouncedQ.toLowerCase()
    return (
      h.name.toLowerCase().includes(q) ||
      (h.city || '').toLowerCase().includes(q) ||
      (h.email || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero header */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 p-10 text-white"
      >
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&h=300&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Find a Hospital</h1>
          <p className="text-primary-100 mb-6">
            {loading ? 'Loading hospitals…' : `${filtered.length} verified hospital${filtered.length !== 1 ? 's' : ''} on MedConnect`}
          </p>
          <div className="flex gap-2 max-w-md">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); goTo(1) }}
                placeholder="Search by name or city…"
                className="input pl-9 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm mt-3">Retry</button>
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200 dark:bg-slate-700" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="card p-12 text-center">
          <BuildingOffice2Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No hospitals found</h3>
          <p className="text-sm text-slate-400">
            {query ? 'Try adjusting your search.' : 'No hospitals are listed yet.'}
          </p>
          {query && (
            <button onClick={() => { setQuery(''); goTo(1) }} className="btn btn-secondary btn-sm mt-3">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((hospital, i) => (
            <HospitalCard key={hospital._id} hospital={hospital} index={(page - 1) * limit + i} />
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
