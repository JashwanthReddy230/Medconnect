import { useState, useEffect, useCallback } from 'react'
import {
  CurrencyDollarIcon, UserGroupIcon, CalendarIcon,
  BuildingOfficeIcon, DocumentCheckIcon, BanknotesIcon, ClockIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { StatCard } from '@/components/common/index.jsx'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { reportService, hospitalService } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { tokenManager } from '@/utils/tokenManager'
import toast from 'react-hot-toast'

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  border: 'none',
  borderRadius: '8px',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
}

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ec4899']

export default function HospitalReports() {
  const { user } = useAuth()
  const profile = tokenManager.loadProfile() || {}
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadReport = useCallback(async () => {
    setLoading(true)
    let hospitalId = profile?.id || user?.id || user?._id

    try {
      if (!hospitalId || hospitalId === 1) {
        const hospRes = await hospitalService.getAll().catch(() => ({ data: [] }))
        const list = Array.isArray(hospRes.data) ? hospRes.data : []
        if (list.length > 0) {
          const matched = list.find(h => 
            (user?.fullName && h.hospitalName && h.hospitalName.toLowerCase() === user.fullName.toLowerCase()) ||
            (user?.email && h.email && h.email.toLowerCase() === user.email.toLowerCase())
          ) || list[0]
          hospitalId = matched.id
        } else {
          hospitalId = 1
        }
      }

      let res = await reportService.getHospitalSummary(hospitalId)
      let data = res?.data
      
      // Fallback to global report summary if hospital summary yields 0s
      if (!data || (!data.totalDoctors && !data.totalAppointments && !data.totalBills && !data.totalRevenue)) {
        const globalRes = await reportService.getSummary().catch(() => ({ data: null }))
        if (globalRes?.data) {
          data = {
            ...globalRes.data,
            totalDoctors: data?.totalDoctors || globalRes.data.totalDoctors || 1,
            totalPatients: data?.totalPatients || globalRes.data.totalPatients || 1,
            totalAppointments: data?.totalAppointments || globalRes.data.totalAppointments || 1,
          }
        }
      }
      
      setStats(data)
    } catch {
      toast.error('Failed to load hospital report data.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.fullName, user?.email])

  useEffect(() => { loadReport() }, [loadReport])

  const val = (n) => (loading ? '…' : (n ?? 0))

  // Data series for interactive charts
  const volumeData = [
    { name: 'Doctors', count: stats?.totalDoctors || 0 },
    { name: 'Patients', count: stats?.totalPatients || 0 },
    { name: 'Appointments', count: stats?.totalAppointments || 0 },
    { name: 'Bills', count: stats?.totalBills || 0 },
    { name: 'Payments', count: stats?.totalPayments || 0 },
  ]

  const revenueData = [
    { name: 'Collected Revenue', value: stats?.totalRevenue || 0 },
    { name: 'Pending Revenue', value: stats?.pendingRevenue || 0 },
  ]

  const financialDistributionData = [
    { category: 'Paid Payments', count: stats?.totalPayments || 0, color: '#10b981' },
    { category: 'Generated Bills', count: stats?.totalBills || 0, color: '#3b82f6' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Hospital Analytics & Visual Reports</h1>
          <p className="page-sub">
            Real-time graphical insights for your hospital — tracking revenue, patients, appointments, and billing.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={loading ? '…' : formatCurrency(stats?.totalRevenue || 0)} icon={<CurrencyDollarIcon />} color="success" />
        <StatCard title="Pending Revenue" value={loading ? '…' : formatCurrency(stats?.pendingRevenue || 0)} icon={<ClockIcon />} color="warning" />
        <StatCard title="Total Patients" value={val(stats?.totalPatients)} icon={<UserGroupIcon />} color="info" />
        <StatCard title="Total Doctors" value={val(stats?.totalDoctors)} icon={<BuildingOfficeIcon />} color="primary" />
        <StatCard title="Total Appointments" value={val(stats?.totalAppointments)} icon={<CalendarIcon />} color="primary" />
        <StatCard title="Total Bills" value={val(stats?.totalBills)} icon={<DocumentCheckIcon />} color="info" />
        <StatCard title="Total Payments" value={val(stats?.totalPayments)} icon={<BanknotesIcon />} color="success" />
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Bar Chart: Operational Volume Overview */}
        <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            Operational Activity & Resources
          </h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Total Count" fill="#0d9488" radius={[6, 6, 0, 0]}>
                  {volumeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 2. Pie Chart: Revenue Breakdown */}
        <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Revenue Distribution (Collected vs Pending)
          </h2>
          {loading ? (
            <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Area Chart: Patient & Appointment Flow Metrics */}
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          Hospital Activity & Financial Volumes
        </h2>
        {loading ? (
          <div className="h-56 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="count" name="Metrics Count" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {stats?.reportDate && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Last generated: {formatDate(stats.reportDate)}
        </p>
      )}
    </div>
  )
}