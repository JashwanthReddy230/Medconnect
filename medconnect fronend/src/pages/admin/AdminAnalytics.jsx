import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, CalendarIcon, BanknotesIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { StatCard } from '@/components/common/index.jsx'
import { adminService, reportService } from '@/api/services'
import { formatDate } from '@/utils/formatters'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--tw-color-white, white)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      adminService.getDashboardStats(),
      reportService.getSummary(),
    ]).then(([statsRes, reportRes]) => {
      if (cancelled) return
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || {})
      if (reportRes.status === 'fulfilled') setReport(reportRes.value.data || null)
    })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const totalUsers = (stats?.totalPatients ?? 0) + (stats?.totalDoctors ?? 0) + (stats?.totalHospitals ?? 0)
  const totalAppts = stats?.totalAppointments ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-sub">Platform-wide totals across all hospitals, doctors and patients</p>
      </div>

      {/* KPI summary — real data from backend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={loading ? '…' : totalUsers.toLocaleString()}
          icon={<UsersIcon />}
          color="primary"
        />
        <StatCard
          title="Total Appointments"
          value={loading ? '…' : totalAppts.toLocaleString()}
          icon={<CalendarIcon />}
          color="info"
        />
        <StatCard
          title="Total Doctors"
          value={loading ? '…' : (stats?.totalDoctors ?? 0).toLocaleString()}
          icon={<ChartBarIcon />}
          color="warning"
        />
        <StatCard
          title="Total Hospitals"
          value={loading ? '…' : (stats?.totalHospitals ?? 0).toLocaleString()}
          icon={<ArrowTrendingUpIcon />}
          color="success"
        />
      </div>

      {/* Report Entity KPIs — totalRevenue, pendingRevenue, totalBills, totalPayments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={loading ? '…' : `₹${((report?.totalRevenue ?? 0)).toLocaleString('en-IN')}`}
          icon={<BanknotesIcon />}
          color="success"
        />
        <StatCard
          title="Pending Revenue"
          value={loading ? '…' : `₹${((report?.pendingRevenue ?? 0)).toLocaleString('en-IN')}`}
          icon={<BanknotesIcon />}
          color="warning"
        />
        <StatCard
          title="Total Bills"
          value={loading ? '…' : (report?.totalBills ?? 0).toLocaleString()}
          icon={<DocumentTextIcon />}
          color="info"
        />
        <StatCard
          title="Total Payments"
          value={loading ? '…' : (report?.totalPayments ?? 0).toLocaleString()}
          icon={<DocumentTextIcon />}
          color="primary"
        />
      </div>

      {report?.reportDate && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
          Last report generated: {formatDate(report.reportDate)}
        </p>
      )}

      {/* Secondary KPIs — real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {loading ? '…' : (stats?.totalPatients ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Patients</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? '…' : ((stats?.totalDoctors ?? 0) - (stats?.pendingDoctors ?? 0)).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Doctors</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '…' : (stats?.pendingDoctors ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending Approvals</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {loading ? '…' : (stats?.todayAppointments ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today's Appointments</p>
        </div>
      </div>

      {/* Platform summary bar chart — real counts, no fabricated series */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-5">Platform Summary (Live)</h2>
        {loading ? (
          <div className="h-52 animate-pulse bg-muted-light dark:bg-muted-dark rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                { label: 'Doctors', count: stats?.totalDoctors || 0 },
                { label: 'Patients', count: stats?.totalPatients || 0 },
                { label: 'Hospitals', count: stats?.totalHospitals || 0 },
                { label: 'Appts', count: stats?.totalAppointments || 0 },
              ]}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Count" fill="#00897b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Platform totals table — real derived numbers */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Platform totals (live)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center text-slate-400 py-4">Loading…</td></tr>
              ) : [
                { cat: 'Total Patients', val: stats?.totalPatients ?? 0, badge: 'badge-info' },
                { cat: 'Total Doctors', val: stats?.totalDoctors ?? 0, badge: 'badge-primary' },
                { cat: 'Active Doctors', val: (stats?.totalDoctors ?? 0) - (stats?.pendingDoctors ?? 0), badge: 'badge-success' },
                { cat: 'Pending Doctor Approvals', val: stats?.pendingDoctors ?? 0, badge: 'badge-warning' },
                { cat: 'Total Hospitals', val: stats?.totalHospitals ?? 0, badge: 'badge-info' },
                { cat: 'Pending Hospitals', val: stats?.pendingHospitals ?? 0, badge: 'badge-warning' },
                { cat: 'Total Appointments', val: stats?.totalAppointments ?? 0, badge: 'badge-success' },
                { cat: "Today's Appointments", val: stats?.todayAppointments ?? 0, badge: 'badge-primary' },
                { cat: 'Total Bills', val: report?.totalBills ?? 0, badge: 'badge-info' },
                { cat: 'Total Payments', val: report?.totalPayments ?? 0, badge: 'badge-success' },
              ].map((row) => (
                <tr key={row.cat}>
                  <td className="font-medium text-slate-700 dark:text-slate-200">{row.cat}</td>
                  <td><span className="text-sm font-bold text-slate-800 dark:text-slate-100">{row.val.toLocaleString()}</span></td>
                  <td><span className={row.badge}>Live</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}