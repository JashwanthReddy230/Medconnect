import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon, CalendarIcon, ShieldCheckIcon,
  StarIcon, ClockIcon, DevicePhoneMobileIcon,
  ChevronRightIcon, ArrowRightIcon, SparklesIcon,
  HeartIcon, CheckCircleIcon, PhoneIcon,
  UserPlusIcon, IdentificationIcon, VideoCameraIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline'
import { adminService, doctorService, hospitalService, patientService, reviewService } from '@/api/services'
import clsx from 'clsx'

const FEATURES = [
  { icon: MagnifyingGlassIcon, title: 'Find the right doctor', description: 'Search by specialty, location, availability, and ratings to find the perfect match for your needs.', color: 'primary' },
  { icon: CalendarIcon, title: 'Book in seconds', description: 'View real-time availability and book a confirmed appointment slot without any back-and-forth.', color: 'success' },
  { icon: ShieldCheckIcon, title: 'Verified professionals', description: 'Every doctor and hospital on MedConnect goes through a rigorous verification process.', color: 'info' },
  { icon: StarIcon, title: 'Honest reviews', description: 'Read authentic reviews from real patients to make informed healthcare decisions.', color: 'warning' },
  { icon: ClockIcon, title: 'Manage appointments', description: 'Track upcoming and past appointments, view prescriptions, and manage your health history.', color: 'primary' },
  { icon: DevicePhoneMobileIcon, title: 'Works on all devices', description: 'Fully responsive — use MedConnect seamlessly on desktop, tablet, or mobile.', color: 'success' },
]

const COLOR_MAP = {
  primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
}

const SPECIALTIES = [
  { name: 'Cardiologist', img: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=80&h=80&fit=crop&auto=format' },
  { name: 'Dermatologist', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=80&h=80&fit=crop&auto=format' },
  { name: 'Neurologist', img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=80&h=80&fit=crop&auto=format' },
  { name: 'Pediatrician', img: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=80&h=80&fit=crop&auto=format' },
  { name: 'Orthopedic', img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=80&h=80&fit=crop&auto=format' },
  { name: 'Psychiatrist', img: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=80&h=80&fit=crop&auto=format' },
  { name: 'Gynecologist', img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=80&h=80&fit=crop&auto=format' },
  { name: 'ENT Specialist', img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=80&h=80&fit=crop&auto=format' },
]

const STEPS = [
  {
    step: '01',
    title: 'Create Account',
    desc: 'User signs up as a Patient, Doctor, or Hospital.',
    bullets: [
      'Easy role-based registration process',
      'Secure credential generation',
      'One-time OTP mobile and email validation'
    ],
    img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop&auto=format',
    iconColor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: UserPlusIcon,
  },
  {
    step: '02',
    title: 'Complete Profile',
    desc: 'Fill in personal details, medical information, or hospital details.',
    bullets: [
      'Upload professional certification and degrees',
      'Configure consulting hours and clinic fees',
      'Input pre-existing medical history and vitals'
    ],
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop&auto=format',
    iconColor: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    icon: IdentificationIcon,
  },
  {
    step: '03',
    title: 'Search & Book',
    desc: 'Search doctors by specialty, hospital, or location and book an appointment.',
    bullets: [
      'Filter from 12+ general and specialized fields',
      'View real-time calendar grids for free slots',
      'Get instant booking approval notification'
    ],
    img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop&auto=format',
    iconColor: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    icon: MagnifyingGlassIcon,
  },
  {
    step: '04',
    title: 'Consultation',
    desc: 'Attend the appointment physically or through video consultation and receive treatment.',
    bullets: [
      'Physical in-clinic visits with live queue status',
      'High definition, encrypted video consultations',
      'Immediate medical consultation review'
    ],
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&auto=format',
    iconColor: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    icon: VideoCameraIcon,
  },
  {
    step: '05',
    title: 'Digital Records',
    desc: 'Access prescriptions, reports, bills, and appointment history securely anytime.',
    bullets: [
      'E-prescriptions linked directly to appointments',
      'Cloud storage of historical bills and lab tests',
      'Strict HIPAA and data safety regulations'
    ],
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&auto=format',
    iconColor: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200 dark:border-sky-800',
    icon: ClipboardDocumentCheckIcon,
  },
]

const TESTIMONIALS = [
  {
    name: 'Kavya R.', role: 'Patient · Hyderabad',
    text: 'MedConnect helped me find a cardiologist within hours. The booking was completely seamless!',
    img: 'https://images.unsplash.com/photo-1494790108755-2616b612b5ff?w=80&h=80&fit=crop&auto=format',
    rating: 5,
  },
  {
    name: 'Dr. Raj Patel', role: 'Cardiologist · Mumbai',
    text: 'My practice grew 40% after joining MedConnect. The platform is incredibly easy to use.',
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&auto=format',
    rating: 5,
  },
  {
    name: 'Meera K.', role: 'Patient · Delhi',
    text: 'I love the prescription tracking feature. It keeps all my medical info in one place.',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    rating: 5,
  },
  {
    name: 'Arjun S.', role: 'Patient · Hyderabad',
    text: 'Booked an appointment with a neurologist in under 2 minutes. Absolutely life-changing app.',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format',
    rating: 5,
  },
]

const GALLERY = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&h=350&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=500&h=350&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=350&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&h=350&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&h=350&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=500&h=350&fit=crop&auto=format',
]

// Avatar initials helper
function DoctorAvatar({ doctor, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'
  const initials = (doctor.doctorName || 'Dr')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  if (doctor.profilePhoto) {
    return (
      <img
        src={doctor.profilePhoto}
        alt={doctor.doctorName}
        className={`${sizeClass} rounded-2xl object-cover flex-shrink-0`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  const colors = [
    'from-primary-500 to-primary-700',
    'from-emerald-500 to-teal-700',
    'from-blue-500 to-indigo-700',
    'from-purple-500 to-violet-700',
    'from-amber-500 to-orange-600',
  ]
  const colorIdx = (doctor.id || 0) % colors.length
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-white">{initials}</span>
    </div>
  )
}

export default function LandingPage() {
  const [stats, setStats] = useState({ totalDoctors: null, totalHospitals: null, totalPatients: null })
  const [statsLoading, setStatsLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [heroDocIdx, setHeroDocIdx] = useState(0)
  const [heroDoctors, setHeroDoctors] = useState([])
  const [heroLoading, setHeroLoading] = useState(true)
  const [liveReviews, setLiveReviews] = useState([])
  const containerRef = useRef(null)
  const [scrollFraction, setScrollFraction] = useState(0)

  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [hospital, setHospital] = useState("");

  useEffect(() => {
    adminService.getDashboardStats()
      .then(res => {
        const d = res.data || {}
        setStats({
          totalDoctors: d.totalDoctors ?? null,
          totalHospitals: d.totalHospitals ?? null,
          totalPatients: d.totalPatients ?? null,
        })
      })
      .catch(() => { })
      .finally(() => setStatsLoading(false))
  }, [])

  // Fetch real doctors for hero cards
  useEffect(() => {
    doctorService.getAll({ size: 6 })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        setHeroDoctors(list.filter(d => d.status === 'ACTIVE' || !d.status).slice(0, 6))
      })
      .catch(() => { })
      .finally(() => setHeroLoading(false))
  }, [])

  // Auto-fetch real reviews dynamically from backend database & resolve real names
  useEffect(() => {
    Promise.allSettled([
      reviewService.getAllAdmin(),
      doctorService.getAll().catch(() => ({ data: [] })),
      hospitalService.getAll().catch(() => ({ data: [] })),
      patientService.getAll().catch(() => ({ data: [] })),
    ]).then(([revRes, docRes, hospRes, patRes]) => {
      const list = revRes.status === 'fulfilled' && Array.isArray(revRes.value?.data) ? revRes.value.data : []
      if (list.length === 0) return

      const docs = docRes.status === 'fulfilled' && Array.isArray(docRes.value?.data) ? docRes.value.data : []
      const hosps = hospRes.status === 'fulfilled' && Array.isArray(hospRes.value?.data) ? hospRes.value.data : []
      const pats = patRes.status === 'fulfilled' && Array.isArray(patRes.value?.data) ? patRes.value.data : []

      const docMap = {}; docs.forEach(d => { if (d.id) docMap[d.id] = d.doctorName || d.name })
      const hospMap = {}; hosps.forEach(h => { if (h.id) hospMap[h.id] = h.hospitalName || h.name })
      const patMap = {}; pats.forEach(p => { if (p.id) patMap[p.id] = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email })

      const formatted = list.map(r => {
        const id = r.reviewerId
        const role = (r.reviewerRole || '').toUpperCase()
        let reviewerName = ''

        if (role === 'HOSPITAL') {
          reviewerName = hospMap[id] || `Hospital #${id}`
        } else if (role === 'DOCTOR') {
          reviewerName = docMap[id] ? `Dr. ${docMap[id]}` : `Doctor #${id}`
        } else {
          reviewerName = patMap[id] || `Patient #${id}`
        }

        let targetName = r.targetType
        if (r.targetType === 'DOCTOR' && docMap[r.targetId]) targetName = `Dr. ${docMap[r.targetId]}`
        if (r.targetType === 'HOSPITAL' && hospMap[r.targetId]) targetName = hospMap[r.targetId]
        if (r.targetType === 'MEDCONNECT') targetName = 'MedConnect Website'

        return {
          name: reviewerName,
          role: targetName ? `Review for ${targetName}` : 'Verified Review',
          text: r.comment || 'Great experience with MedConnect!',
          rating: r.rating || 5,
          img: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reviewerName)}`
        }
      })
      setLiveReviews(formatted)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (heroDoctors.length === 0) return
    const timer = setInterval(() => {
      setHeroDocIdx((prev) => (prev + 1) % heroDoctors.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroDoctors.length])

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const stickyOffset = 64
      const rect = containerRef.current.getBoundingClientRect()
      const containerHeight = rect.height
      const containerTop = rect.top + window.scrollY

      const scrolled = window.scrollY - (containerTop - stickyOffset)
      const maxScroll = containerHeight - (window.innerHeight - stickyOffset)

      if (scrolled < 0) {
        setScrollFraction(0)
      } else if (scrolled > maxScroll) {
        setScrollFraction(1)
      } else {
        setScrollFraction(scrolled / maxScroll)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const STATS = [
    { value: statsLoading ? '…' : stats.totalDoctors !== null ? `${stats.totalDoctors.toLocaleString()}+` : '10K+', label: 'Verified Doctors' },
    { value: statsLoading ? '…' : stats.totalHospitals !== null ? `${stats.totalHospitals.toLocaleString()}+` : '500+', label: 'Partner Hospitals' },
    { value: statsLoading ? '…' : stats.totalPatients !== null ? `${stats.totalPatients.toLocaleString()}+` : '2M+', label: 'Patients Served' },
    { value: '4.9★', label: 'Average Rating' },
  ]

  return (
    <div>

      {/* ══ 1. FULL-SCREEN HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        {/* Hero background */}
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop&auto=format"
          alt="Healthcare"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/20 dark:from-surface-dark/95 dark:via-surface-dark/80 dark:to-surface-dark/20" />

        {/* Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/40 dark:bg-primary-900/20 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-100/30 dark:bg-primary-900/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              India's most trusted healthcare platform
            </div>
            <h1 className="text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-6">
              Find the right<br />
              <span className="text-primary-600 dark:text-primary-400">doctor,</span><br />
              right now.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
              MedConnect makes healthcare accessible. Search verified doctors, book appointments instantly, and manage your complete health — all in one platform.
            </p>

            {/* Search bar */}
            <div className="flex gap-2 max-w-lg mb-8">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search by specialty, doctor name, or city…"
                  className="input pl-10 py-3 text-base shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href =
                        `/doctors?q=${encodeURIComponent(searchQ)}&specialization=${encodeURIComponent(specialization)}&location=${encodeURIComponent(location)}&hospital=${encodeURIComponent(hospital)}`;
                    }
                  }}
                />
              </div>

              <Link
                to={`/doctors?q=${encodeURIComponent(searchQ)}&specialization=${encodeURIComponent(specialization)}&location=${encodeURIComponent(location)}&hospital=${encodeURIComponent(hospital)}`}
                className="btn btn-primary px-5 py-3 text-base font-semibold shadow-lg"
              >
                Search
              </Link>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2 mb-10">
              {['Cardiologist', 'Dermatologist', 'Pediatrician', 'Neurologist'].map((s) => (
                <Link
                  key={s}
                  to={`/doctors?specialty=${s}`}
                  className="px-3 py-1.5 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-sm"
                >
                  {s}
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/doctors" className="btn btn-primary btn-lg gap-2 text-base shadow-lg">
                Find a doctor <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/hospitals" className="btn btn-secondary btn-lg text-base">
                Browse hospitals
              </Link>
            </div>
          </div>

          {/* Right — Live Doctor Cards from DB */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-[440px] h-[540px]">

              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-100/60 via-transparent to-emerald-100/40 dark:from-primary-900/20 dark:to-emerald-900/10 blur-2xl pointer-events-none" />

              {heroLoading ? (
                /* Skeleton while loading */
                <div className="absolute top-6 left-6 w-[340px] card p-6 shadow-xl animate-pulse">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />)}
                  </div>
                  <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              ) : heroDoctors.length === 0 ? (
                /* No doctors yet */
                <div className="absolute top-6 left-6 w-[340px] card p-8 shadow-xl text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheckIcon className="w-7 h-7 text-primary-500" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Doctors joining soon</p>
                  <p className="text-xs text-slate-400 mb-4">Be the first verified doctor on MedConnect.</p>
                  <Link to="/register/doctor" className="btn btn-primary btn-sm w-full">Join as a doctor</Link>
                </div>
              ) : (
                /* Main live doctor card */
                <div
                  className="absolute top-6 left-6 w-[340px] card p-5 shadow-2xl transition-all duration-700 ease-out"
                  key={heroDocIdx}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <DoctorAvatar doctor={heroDoctors[heroDocIdx]} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                          {heroDoctors[heroDocIdx].doctorName || 'Doctor'}
                        </p>
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium truncate">
                        {heroDoctors[heroDocIdx].specialization || 'General Physician'}
                      </p>
                      {heroDoctors[heroDocIdx].qualification && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{heroDoctors[heroDocIdx].qualification}</p>
                      )}
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1">4.9</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-2 text-center">
                      <p className="text-sm font-black text-primary-700 dark:text-primary-300">
                        {heroDoctors[heroDocIdx].experience ? `${heroDoctors[heroDocIdx].experience}yr` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Experience</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 text-center">
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">✓ Active</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Status</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center">
                      <p className="text-sm font-black text-amber-700 dark:text-amber-300">
                        {heroDoctors[heroDocIdx].consultationFee
                          ? `₹${heroDoctors[heroDocIdx].consultationFee}`
                          : 'Free'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Fee</p>
                    </div>
                  </div>

                  <Link
                    to={`/doctors/${heroDoctors[heroDocIdx].id}`}
                    className="btn btn-primary w-full py-2.5 text-sm"
                  >
                    Book appointment
                  </Link>

                  {/* Dots indicator */}
                  {heroDoctors.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {heroDoctors.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setHeroDocIdx(i)}
                          className={clsx(
                            'rounded-full transition-all duration-300',
                            i === heroDocIdx
                              ? 'w-5 h-1.5 bg-primary-500'
                              : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Floating — Total Doctors badge */}
                  <div className="absolute -top-3 right-8 card px-3.5 py-2 shadow-lg z-20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {statsLoading ? '…' : `${stats.totalDoctors ?? heroDoctors.length}+ Verified Doctors`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. STATS BAR ══════════════════════════════════════════════════════ */}
      <section className="py-14 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-black text-white">{value}</p>
                <p className="text-sm text-primary-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. SPECIALTIES ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-card-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Browse by specialty</span>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2 mb-3">
              Every specialty.<br />One platform.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Connect with specialists across every medical field — verified, reviewed, and ready to see you.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECIALTIES.map(({ name, img }) => (
              <Link
                key={name}
                to={`/doctors?specialty=${encodeURIComponent(name)}`}
                className="group relative overflow-hidden rounded-2xl aspect-square shadow hover:shadow-card-hover transition-shadow"
              >
                <img
                  src={img}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.parentElement.className = 'group relative overflow-hidden rounded-2xl aspect-square bg-primary-100 dark:bg-primary-900/20' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-bold text-sm leading-tight">{name}</p>
                  <p className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1">
                    Book now <ChevronRightIcon className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/doctors" className="btn btn-primary btn-lg gap-2">
              View all specialties <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT WORKS — Sticky Horizontal Scroll Section ═══════════════ */}
      <div ref={containerRef} className="relative h-[450vh] bg-white dark:bg-surface-dark">
        {/* Sticky container */}
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col justify-between py-12 md:py-16">
          {/* Header */}
          <div className="text-center px-4 mt-4">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/20 px-3.5 py-1.5 rounded-full">
              Step by step
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mt-3.5">
              How MedConnect works
            </h2>
          </div>

          {/* Horizontal slider viewport */}
          <div className="relative w-full flex-1 flex items-center overflow-hidden">
            <div
              className="flex w-[500vw] h-full items-center transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${scrollFraction * 80}%)` }}
            >
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon
                const activeIndex = Math.min(
                  Math.floor(scrollFraction * STEPS.length),
                  STEPS.length - 1
                )
                const isActive = idx === activeIndex

                return (
                  <div key={idx} className="w-screen flex-shrink-0 flex items-center justify-center px-4 sm:px-12 md:px-24">
                    <div
                      className={clsx(
                        "card max-w-5xl w-full bg-white dark:bg-card-dark rounded-[24px] shadow-2xl border border-border-light dark:border-border-dark overflow-hidden grid md:grid-cols-2 gap-8 p-6 sm:p-10 md:p-12 items-center transition-all duration-700 ease-out",
                        isActive ? "opacity-100 translate-y-0 scale-100 shadow-2xl" : "opacity-25 translate-y-8 scale-95 pointer-events-none"
                      )}
                    >
                      {/* Left: Info */}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-3.5 mb-2">
                          <div className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500",
                            step.iconColor,
                            isActive ? "scale-110" : "scale-100"
                          )}>
                            <StepIcon className="w-6 h-6" />
                          </div>
                          <span className="text-5xl font-black text-slate-200 dark:text-slate-800/70 leading-none">
                            {step.step}
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3.5">
                          {step.title}
                        </h3>
                        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                          {step.desc}
                        </p>
                        <ul className="space-y-3">
                          {step.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2.5 text-sm text-slate-650 dark:text-slate-400">
                              <CheckCircleIcon className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Premium Image */}
                      <div className="h-64 sm:h-72 md:h-[350px] w-full rounded-2xl overflow-hidden relative shadow-lg">
                        <img
                          src={step.img}
                          alt={step.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.classList.add('bg-primary-50', 'dark:bg-primary-900/10')
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {/* Interactive floating label */}
                        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-card-dark/90 backdrop-blur px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                            {step.title} Live
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Controls / Progress bar */}
          <div className="flex flex-col items-center gap-3">
            {/* Dots */}
            <div className="flex gap-2">
              {STEPS.map((_, sIdx) => {
                const activeIndex = Math.min(
                  Math.floor(scrollFraction * STEPS.length),
                  STEPS.length - 1
                )
                return (
                  <div
                    key={sIdx}
                    className={clsx(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      sIdx === activeIndex ? "bg-primary-600 w-6" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                )
              })}
            </div>
            {/* Progress indicator */}
            <div className="w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-300 ease-out"
                style={{ width: `${scrollFraction * 100}%` }}
              />
            </div>
            {/* Step Counter */}
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Step {Math.min(Math.floor(scrollFraction * STEPS.length) + 1, STEPS.length)} of {STEPS.length}
            </p>
          </div>
        </div>
      </div>

      {/* ══ 5. FULL-WIDTH PHOTO GALLERY ════════════════════════════════════ */}
      <section className="grid grid-cols-2 sm:grid-cols-3 h-72 sm:h-96">
        {GALLERY.map((src, i) => (
          <div key={i} className="overflow-hidden group relative">
            <img
              src={src}
              alt="Healthcare"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => { e.target.parentElement.style.background = '#e0e7ff' }}
            />
            <div className="absolute inset-0 bg-primary-900/20 group-hover:bg-primary-900/10 transition-colors" />
          </div>
        ))}
      </section>

      {/* ══ 6. FEATURES GRID ════════════════════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-card-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Everything you need</span>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2 mb-3">
              One platform, complete care
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              From finding a doctor to managing your full health history — MedConnect has you covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="card p-6 group hover:shadow-card-hover transition-shadow">
                  <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', COLOR_MAP[feat.color])}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-base">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ 7. FULL-BLEED PROMO SPLIT ═══════════════════════════════════════ */}
      <section className="grid lg:grid-cols-2">
        {/* Image half */}
        <div className="relative h-72 lg:h-auto overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop&auto=format"
            alt="Doctor with patient"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-900/30" />

        </div>
        {/* Content half */}
        <div className="bg-primary-600 dark:bg-primary-800 px-8 sm:px-16 py-20 flex flex-col justify-center">
          <SparklesIcon className="w-10 h-10 text-primary-300 mb-4" />
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Connect with India's best<br />doctors today.
          </h2>
          <p className="text-primary-200 text-base mb-8 leading-relaxed">
            Join millions of patients who've already discovered the easiest way to access quality healthcare — any time, any specialty.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/register/patient" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-bold shadow-lg">
              Get started free
            </Link>
            <Link to="/doctors" className="btn border border-primary-300 text-white hover:bg-primary-700 btn-lg">
              Browse doctors
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 8. TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section className="py-20 bg-muted-light dark:bg-surface-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-[0.03] pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=800&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Trusted by thousands</span>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2">What our users say</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(liveReviews.length > 0 ? liveReviews : TESTIMONIALS).slice(0, 4).map((t, i) => (
              <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(t.rating || 5)].map((_, j) => (
                      <StarIcon key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed mb-4 flex-1">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-border-light dark:border-border-dark">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-primary-100"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. PARTNER HOSPITALS ════════════════════════════════════════════ */}
      <section className="py-16 bg-white dark:bg-card-dark">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by leading hospitals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'Apollo Hospitals', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&h=180&fit=crop&auto=format' },
              { name: 'AIIMS', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&h=180&fit=crop&auto=format' },
              { name: 'Fortis Healthcare', img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&h=180&fit=crop&auto=format' },
              { name: 'Max Hospital', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&h=180&fit=crop&auto=format' },
              { name: 'Manipal Hospitals', img: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=300&h=180&fit=crop&auto=format' },
              { name: 'Columbia Asia', img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&h=180&fit=crop&auto=format' },
            ].map((h) => (
              <Link key={h.name} to="/hospitals" className="group relative overflow-hidden rounded-2xl h-28 sm:h-36 shadow hover:shadow-card-hover transition-shadow">
                <img src={h.img} alt={h.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-xs">{h.name}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/hospitals" className="btn btn-secondary btn-lg mt-8 gap-2">
            Browse all hospitals <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══ 10. FINAL FULL-SCREEN CTA ═══════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1920&h=1080&fit=crop&auto=format"
          alt="Healthcare"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <HeartIcon className="w-12 h-12 text-primary-300 mb-5" />
            <h2 className="text-5xl font-black text-white mb-5 leading-tight">
              Your health deserves<br />better connections.
            </h2>
            <p className="text-primary-200 text-xl mb-8 leading-relaxed">
              Join {statsLoading ? 'millions of' : `${stats.totalPatients !== null ? stats.totalPatients.toLocaleString() + '+' : 'thousands of'}`} patients who've found the right care on MedConnect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register/patient" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-black shadow-xl text-base">
                Get started — it's free ✨
              </Link>
              <Link to="/about" className="btn border border-primary-300 text-white hover:bg-primary-700 btn-lg text-base">
                Learn about us
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-8">
              {[
                { icon: ShieldCheckIcon, text: 'Verified doctors' },
                { icon: PhoneIcon, text: '24/7 support' },
                { icon: CheckCircleIcon, text: 'Free to use' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-primary-200 text-sm">
                  <Icon className="w-4 h-4 text-primary-300" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}