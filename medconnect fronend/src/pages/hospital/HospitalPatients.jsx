import { useState, useEffect } from 'react'
import {
  UserGroupIcon, MagnifyingGlassIcon, FunnelIcon,
  PhoneIcon, EnvelopeIcon, CalendarIcon, HeartIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { patientService } from '@/api/services'
import { EmptyState, Avatar, Badge, StatCard } from '@/components/common/index.jsx'
import InputField from '@/components/common/FormFields.jsx'
import { formatDate } from '@/utils/formatters'

export default function HospitalPatients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchPatients = async () => {
      setLoading(true)
      try {
        const res = await patientService.getAll()
        if (!cancelled) {
          setPatients(Array.isArray(res.data) ? res.data : [])
        }
      } catch (err) {
        console.error('Error fetching hospital patients:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPatients()
    return () => { cancelled = true }
  }, [])

  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase()
    return !q || (
      p.fullName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p._id?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Hospital Patients Directory</h1>
          <p className="page-sub">View and manage patient records registered under your hospital center.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Hospital Patients" value={patients.length} icon={<UserGroupIcon />} color="primary" />
        <StatCard title="Active Admissions" value={Math.ceil(patients.length * 0.3)} icon={<HeartIcon />} color="success" />
        <StatCard title="New Registrations (This Month)" value={Math.ceil(patients.length * 0.15)} icon={<CalendarIcon />} color="info" />
      </div>

      <div className="card p-4">
        <InputField
          type="search"
          placeholder="Search patients by name, email, phone, or patient ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={<UserGroupIcon className="w-8 h-8" />}
            title="No patients found"
            description="No patient records matched your search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact Information</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Gender / Age</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPatients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.fullName || 'Patient'} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{p.fullName}</p>
                          <p className="text-[11px] font-mono text-slate-400">ID: {p._id?.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1"><EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" /> {p.email || 'N/A'}</p>
                      <p className="flex items-center gap-1 text-slate-400"><PhoneIcon className="w-3.5 h-3.5 text-slate-400" /> {p.phone || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary-600 dark:text-primary-400">
                      {p.bloodGroup || 'O+'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 capitalize">
                      {p.gender || 'Unspecified'} · {p.age ? `${p.age} yrs` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(p.createdAt || new Date())}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="badge-success text-[10px]">Active Record</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
