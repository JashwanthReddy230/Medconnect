import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  HeartIcon, ShieldCheckIcon, GlobeAltIcon,
  UserGroupIcon, EnvelopeIcon, PhoneIcon,
  MapPinIcon, CheckCircleIcon, MagnifyingGlassIcon,
  TagIcon, ClockIcon, HomeIcon, SparklesIcon,
  LightBulbIcon, TrophyIcon,
} from '@heroicons/react/24/outline'
import { Input, TextArea, Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import { formatDate, truncate } from '@/utils/formatters'
import { usePagination, useDebounce } from '@/hooks/index.js'
import { Pagination } from '@/components/common/index.jsx'
import { blogService } from '@/api/services'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── About Page ─────────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: 'Dr. Angela Rhodes', role: 'Chief Medical Officer', initials: 'AR',
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&auto=format',
    desc: '20+ years of clinical practice. Former Head of Cardiology at AIIMS.',
  },
  {
    name: 'Marcus Chen', role: 'Chief Technology Officer', initials: 'MC',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
    desc: 'Ex-Google engineer. Passionate about technology that saves lives.',
  },
  {
    name: 'Priya Sharma', role: 'Head of Product', initials: 'PS',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&auto=format',
    desc: 'UX expert focused on making healthcare easy for every Indian.',
  },
  {
    name: 'James Okafor', role: 'Head of Partnerships', initials: 'JO',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
    desc: 'Built partnerships with 500+ hospitals across 20 Indian states.',
  },
]

const VALUES = [
  {
    icon: HeartIcon, title: 'Patient First',
    desc: 'Every decision we make starts with one question: is this better for the patient?',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=250&fit=crop&auto=format',
  },
  {
    icon: ShieldCheckIcon, title: 'Trust & Safety',
    desc: 'We rigorously verify every doctor and hospital before they appear on our platform.',
    color: 'from-primary-500 to-primary-700',
    bg: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=250&fit=crop&auto=format',
  },
  {
    icon: GlobeAltIcon, title: 'Accessibility',
    desc: 'Quality healthcare should be available to everyone, regardless of location or income.',
    color: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    img: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=250&fit=crop&auto=format',
  },
  {
    icon: UserGroupIcon, title: 'Community',
    desc: 'We build tools that strengthen the relationship between patients and healthcare providers.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=250&fit=crop&auto=format',
  },
]

const MILESTONES = [
  { year: '2022', event: 'MedConnect founded in Hyderabad with 5 hospitals.' },
  { year: '2023', event: 'Expanded to 12 cities. Crossed 1 lakh patients.' },
  { year: '2024', event: 'Launched telemedicine and prescription management.' },
  { year: '2025', event: '10,000+ verified doctors. 2M+ patients connected.' },
]

export function AboutPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Full-screen hero ── */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=900&fit=crop&auto=format"
          alt="Hospital building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/70 via-primary-800/60 to-primary-900/80" />
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium mb-5">
            <SparklesIcon className="w-3.5 h-3.5" /> Our Story
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight drop-shadow-lg">
            Connecting India to<br />
            <span className="text-primary-300">Better Healthcare</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to make healthcare more accessible, transparent, and human — by building the bridge between patients and the right medical professionals.
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-primary-600 dark:bg-primary-800 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '2022', label: 'Founded', sub: 'Hyderabad, India' },
            { value: '2M+',  label: 'Patients', sub: 'Connected' },
            { value: '10K+', label: 'Doctors', sub: 'Verified' },
            { value: '500+', label: 'Hospitals', sub: 'Pan India' },
          ].map(({ value, label, sub }) => (
            <div key={label}>
              <p className="text-4xl font-black text-white">{value}</p>
              <p className="text-sm font-semibold text-primary-200 mt-0.5">{label}</p>
              <p className="text-xs text-primary-300">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Story — full-bleed image + text ── */}
      <section className="py-0">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-80 lg:h-auto min-h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&auto=format"
              alt="Doctors working together"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/40 to-transparent" />
          </div>
          <div className="bg-white dark:bg-card-dark px-8 py-16 lg:px-16 flex flex-col justify-center">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-3">Our Journey</span>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-6 leading-tight">
              Born out of<br />frustration.
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed text-base">
              <p>MedConnect was founded in 2022 by healthcare professionals who were frustrated by how difficult it was for patients to find the right doctor — and for doctors to grow their practices.</p>
              <p>We built MedConnect to solve that. Today, we connect over <strong>2 million patients</strong> with <strong>10,000+ verified doctors</strong> and <strong>500+ hospitals</strong> across India.</p>
              <p>Our platform handles everything from discovery to booking, making healthcare connections simpler for everyone involved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-20 bg-muted-light dark:bg-surface-dark">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Milestones</span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">Our timeline</h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-primary-200 dark:bg-primary-900/50" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative z-10 shadow-md">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="card p-4 flex-1">
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">{m.year}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values — image cards ── */}
      <section className="py-20 bg-white dark:bg-card-dark">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">What we stand for</span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, bg, img }) => (
              <div key={title} className="card overflow-hidden group hover:shadow-card-hover transition-shadow">
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.parentElement.className = 'h-44 bg-primary-100 dark:bg-primary-900/20' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className={clsx('absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-bleed mission quote ── */}
      <section className="relative py-28 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=1600&h=600&fit=crop&auto=format"
          alt="Healthcare team"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/75" />
        <div className="relative text-center max-w-3xl mx-auto px-4">
          <LightBulbIcon className="w-10 h-10 text-primary-300 mx-auto mb-4" />
          <blockquote className="text-2xl sm:text-3xl font-black text-white italic leading-snug">
            "The best healthcare is the one that finds you before you need to search for it."
          </blockquote>
          <p className="text-primary-300 mt-4 text-sm">— Dr. Angela Rhodes, CMO, MedConnect</p>
        </div>
      </section>

      {/* ── Team — with real photos ── */}
      <section className="py-20 bg-white dark:bg-card-dark">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">The people behind it</span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">Leadership team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map(({ name, role, initials, img, desc }) => (
              <div key={name} className="card overflow-hidden group hover:shadow-card-hover transition-shadow text-center">
                <div className="h-44 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/20 relative">
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl font-black text-primary-600/40">${initials}</div>`
                    }}
                  />
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{name}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5">{role}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Image gallery strip ── */}
      <section className="h-56 sm:h-72 flex overflow-hidden">
        {[
          'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop&auto=format',
          'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=300&fit=crop&auto=format',
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop&auto=format',
          'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop&auto=format',
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=300&fit=crop&auto=format',
        ].map((src, i) => (
          <div key={i} className="flex-1 overflow-hidden group">
            <img
              src={src}
              alt="Healthcare"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <TrophyIcon className="w-12 h-12 text-primary-300 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-4">Join MedConnect today</h2>
          <p className="text-primary-200 text-lg mb-8">
            Whether you're a patient looking for care, or a doctor looking to grow your practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register/patient" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-bold">
              Get started as a patient
            </Link>
            <Link to="/register/doctor" className="btn border border-primary-300 text-white hover:bg-primary-700 btn-lg">
              Register as a doctor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Contact Page ───────────────────────────────────────────────────────────────
const SUBJECTS = [
  { value: 'general',     label: 'General inquiry'     },
  { value: 'support',     label: 'Technical support'   },
  { value: 'partnership', label: 'Partnership inquiry' },
  { value: 'media',       label: 'Media & press'       },
  { value: 'other',       label: 'Other'               },
]

export function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
    toast.success('Message sent! We\'ll respond within 24 hours.')
  }

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <div className="relative h-52 flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=400&fit=crop&auto=format"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/70" />
        <div className="relative text-center">
          <h1 className="text-4xl font-black text-white mb-2">Contact us</h1>
          <p className="text-primary-200">Have a question or need help? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-5">
            {[
              { icon: EnvelopeIcon, label: 'Email',   value: 'suppotterm@medconnect.com' },
              { icon: PhoneIcon,    label: 'Phone',   value: '+91 40 5550 0100' },
              { icon: MapPinIcon,   label: 'Address', value: '123 Health Ave, Hitech City, Hyderabad, Telangana 500081' },
              { icon: ClockIcon,    label: 'Hours',   value: 'Mon–Sat · 9 AM–6 PM IST' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2 card p-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Message received!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Our team will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Your name" required placeholder="Jane Smith" error={errors.name?.message}
                    {...register('name', validators.name)} />
                  <Input label="Email address" type="email" required placeholder="you@example.com" error={errors.email?.message}
                    {...register('email', validators.email)} />
                </div>
                <Select label="Subject" options={SUBJECTS} placeholder="Select a subject" required error={errors.subject?.message}
                  {...register('subject', { required: 'Please select a subject' })} />
                <TextArea label="Message" rows={5} required placeholder="Tell us how we can help…" error={errors.message?.message}
                  {...register('message', validators.textArea(20, 2000))} />
                <Button type="submit" loading={loading} className="w-full" icon={<EnvelopeIcon className="w-4 h-4" />}>
                  Send message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Blog Listing Page ──────────────────────────────────────────────────────────
const FALLBACK_POSTS = [
  { _id:'1', title:'10 Signs You Should See a Cardiologist', category:'Cardiology', readTime:5,
    excerpt:'Learn the key warning signs that indicate it\'s time to schedule a visit with a heart specialist.',
    tags:['heart','health'], publishedAt: new Date(Date.now()-86400000).toISOString(),
    img:'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop&auto=format' },
  { _id:'2', title:'How to Manage Stress in Daily Life', category:'Mental Health', readTime:7,
    excerpt:'Practical evidence-based strategies to reduce stress and improve your overall mental wellbeing.',
    tags:['stress','wellness'], publishedAt: new Date(Date.now()-172800000).toISOString(),
    img:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop&auto=format' },
  { _id:'3', title:'Complete Guide to Healthy Eating', category:'Nutrition', readTime:9,
    excerpt:'A comprehensive look at building a balanced diet that supports long-term health and energy levels.',
    tags:['diet','nutrition'], publishedAt: new Date(Date.now()-259200000).toISOString(),
    img:'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=450&fit=crop&auto=format' },
  { _id:'4', title:'Childhood Vaccines: What Parents Should Know', category:'Pediatrics', readTime:6,
    excerpt:'A complete breakdown of the recommended vaccine schedule for children and why each one matters.',
    tags:['kids','vaccines'], publishedAt: new Date(Date.now()-345600000).toISOString(),
    img:'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=800&h=450&fit=crop&auto=format' },
  { _id:'5', title:'Understanding Back Pain and Treatment Options', category:'Orthopedics', readTime:8,
    excerpt:'From posture to physical therapy — everything you need to know about diagnosing and treating back pain.',
    tags:['pain','spine'], publishedAt: new Date(Date.now()-432000000).toISOString(),
    img:'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=450&fit=crop&auto=format' },
  { _id:'6', title:'Skin Health: Daily Care Routines That Work', category:'Dermatology', readTime:5,
    excerpt:'Dermatologists share the morning and evening skincare habits that make the biggest difference.',
    tags:['skin','beauty'], publishedAt: new Date(Date.now()-518400000).toISOString(),
    img:'https://images.unsplash.com/photo-1631390865523-8c66fdbc0938?w=800&h=450&fit=crop&auto=format' },
  { _id:'7', title:'Diabetes Management: Living Well Every Day', category:'Endocrinology', readTime:8,
    excerpt:'Tips from specialists on diet, exercise and medication adherence for type 2 diabetes.',
    tags:['diabetes','lifestyle'], publishedAt: new Date(Date.now()-604800000).toISOString(),
    img:'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop&auto=format' },
  { _id:'8', title:"Women's Health: The Complete Preventive Care Guide", category:'Gynecology', readTime:10,
    excerpt:'Annual screenings, hormonal health and reproductive care milestones every woman should know.',
    tags:['women','prevention'], publishedAt: new Date(Date.now()-691200000).toISOString(),
    img:'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&h=450&fit=crop&auto=format' },
]

const CATEGORIES = ['All', 'Cardiology', 'Mental Health', 'Nutrition', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Endocrinology', 'Gynecology']

const CATEGORY_COLORS = {
  Cardiology:     'badge-danger',
  'Mental Health':'badge-primary',
  Nutrition:      'badge-success',
  Pediatrics:     'badge-info',
  Orthopedics:    'badge-warning',
  Dermatology:    'badge-neutral',
  Endocrinology:  'badge-success',
  Gynecology:     'badge-primary',
}

export function BlogPage() {
  const [posts,    setPosts]    = useState(FALLBACK_POSTS)
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')
  const [fetching, setFetching] = useState(true)
  const debouncedQ = useDebounce(query, 300)
  const { page, limit, goTo, changeLimit } = usePagination(1, 6)

  useEffect(() => {
    blogService.getAll()
      .then(res => {
        const data = res.data
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data.map((p, i) => ({
            _id: p.id || p._id || String(i),
            title: p.title || 'Untitled',
            category: p.category || 'General Health',
            readTime: p.readTime || Math.ceil((p.content?.length || 500) / 200),
            excerpt: p.excerpt || p.content?.slice(0, 150) || '',
            tags: p.tags || [],
            publishedAt: p.publishedAt || p.createdAt || new Date().toISOString(),
            img: p.imageUrl || FALLBACK_POSTS[i % FALLBACK_POSTS.length]?.img,
          })))
        }
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setFetching(false))
  }, [])

  const filtered = posts.filter((p) => {
    const matchQ = !debouncedQ || p.title.toLowerCase().includes(debouncedQ.toLowerCase())
    const matchC = category === 'All' || p.category === category
    return matchQ && matchC
  })

  const totalPages = Math.ceil(filtered.length / limit)
  const paginated  = filtered.slice((page - 1) * limit, page * limit)

  // Featured post = first in filtered list
  const featured   = paginated[0]
  const rest        = paginated.slice(1)

  return (
    <div className="overflow-x-hidden">
      {/* ── Full-screen hero ── */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=700&fit=crop&auto=format"
          alt="Health blog"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-800/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium mb-5">
              <SparklesIcon className="w-3.5 h-3.5" /> MedConnect Health Blog
            </span>
            <h1 className="text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">
              Health Insights.<br />Expert Advice.
            </h1>
            <p className="text-white/80 text-base mb-6 leading-relaxed">
              Evidence-based articles from India's top medical professionals — straight to your screen.
            </p>
            {/* Search */}
            <div className="flex gap-2 max-w-sm">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); goTo(1) }}
                  placeholder="Search articles…"
                  className="input pl-9 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category pills ── */}
      <section className="sticky top-16 z-30 bg-white/90 dark:bg-card-dark/90 backdrop-blur border-b border-border-light dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); goTo(1) }}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                  category === cat
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-muted-light dark:bg-muted-dark text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Loading skeleton ── */}
        {fetching ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-52 bg-slate-200 dark:bg-slate-700" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="card py-16 text-center text-slate-400">No articles found.</div>
        ) : (
          <>
            {/* ── Featured article (large) ── */}
            {featured && page === 1 && (
              <Link to={`/blog/${featured._id}`} className="group block mb-8">
                <div className="card overflow-hidden lg:flex hover:shadow-card-hover transition-shadow">
                  <div className="lg:w-3/5 h-64 lg:h-auto overflow-hidden relative">
                    <img
                      src={featured.img}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('bg-primary-50', 'dark:bg-primary-900/20')
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="badge-primary text-xs">Featured</span>
                    </div>
                  </div>
                  <div className="lg:w-2/5 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={clsx('badge', CATEGORY_COLORS[featured.category] || 'badge-neutral')}>
                        {featured.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" /> {featured.readTime} min read
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-3 leading-snug">
                      {featured.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      {truncate(featured.excerpt, 180)}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(featured.tags || []).map((t) => (
                        <span key={t} className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <TagIcon className="w-2.5 h-2.5" />{t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(featured.publishedAt)}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* ── Rest of articles grid ── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(page === 1 ? rest : paginated).map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post._id}`}
                  className="card overflow-hidden group hover:shadow-card-hover transition-shadow flex flex-col"
                >
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('bg-primary-50', 'dark:bg-primary-900/10')
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className={clsx('badge text-[10px]', CATEGORY_COLORS[post.category] || 'badge-neutral')}>
                        {post.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] text-white/80 bg-black/30 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" /> {post.readTime} min
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug mb-2 flex-1">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {truncate(post.excerpt, 100)}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-light dark:border-border-dark">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags || []).slice(0, 2).map((t) => (
                          <span key={t} className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <TagIcon className="w-2.5 h-2.5" />{t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!fetching && paginated.length > 0 && (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goTo}
              pageSize={limit}
              onPageSizeChange={changeLimit}
              total={filtered.length}
            />
          </div>
        )}
      </div>

      {/* ── Newsletter / CTA strip ── */}
      <section className="relative py-20 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=500&fit=crop&auto=format"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-900/80" />
        <div className="relative text-center max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-black text-white mb-3">Stay healthy. Stay informed.</h2>
          <p className="text-primary-200 mb-6">Book a consultation with a verified doctor today.</p>
          <Link to="/doctors" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-bold">
            Find your doctor →
          </Link>
        </div>
      </section>
    </div>
  )
}

// ── 404 Page ───────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-muted-light dark:bg-surface-dark">
      <div className="max-w-md animate-fade-in">
        <div className="text-8xl font-bold text-primary-200 dark:text-primary-900 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Page not found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary btn-lg gap-2">
            <HomeIcon className="w-5 h-5" />
            Go home
          </Link>
          <Link to="/doctors" className="btn btn-secondary btn-lg">
            Find a doctor
          </Link>
        </div>
      </div>
    </div>
  )
}
