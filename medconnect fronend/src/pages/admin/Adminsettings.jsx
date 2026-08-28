import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    KeyIcon, BellIcon, ShieldCheckIcon, Cog6ToothIcon,
    CheckCircleIcon, ExclamationTriangleIcon, ServerIcon,
    UsersIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { PasswordInput, Input, TextArea } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import { authService } from '@/api/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = [
    { id: 'account', label: 'Account', icon: ShieldCheckIcon },
    { id: 'platform', label: 'Platform', icon: Cog6ToothIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'notifs', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ServerIcon },
]

function SettingRow({ label, description, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-border-light dark:border-border-dark last:border-0">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    )
}

function Toggle({ enabled, onChange, label }) {
    return (
        <button type="button" onClick={() => onChange(!enabled)} aria-label={label}
            className={clsx('relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={clsx('absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform', enabled && 'translate-x-5')} />
        </button>
    )
}

export default function AdminSettings() {
    const { user, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('account')
    const [loading, setLoading] = useState(false)

    const getMemberSince = () => {
        if (!user?.iat) return { date: 'Recent', relative: 'Just joined' }
        const dateObj = new Date(user.iat * 1000)
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        const diffMs = Date.now() - dateObj.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffMonths = Math.floor(diffDays / 30)
        const diffYears = Math.floor(diffDays / 365)
        
        let relative = 'Just joined'
        if (diffYears > 0) {
            relative = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
        } else if (diffMonths > 0) {
            relative = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
        } else if (diffDays > 0) {
            relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else {
            relative = 'Today'
        }
        return { date: dateStr, relative }
    }
    const memberSince = getMemberSince()


    const [platformConfig, setPlatformConfig] = useState({
        maintenanceMode: false,
        newRegistrations: true,
        doctorSelfRegistration: true,
        reviewsEnabled: true,
        blogEnabled: true,
        requireEmailVerification: true,
    })

    const [notifPrefs, setNotifPrefs] = useState({
        newDoctorRegistration: true,
        newHospitalRegistration: true,
        flaggedReview: true,
        systemAlerts: true,
        weeklyReport: false,
        emailDigest: true,
    })

    const { register, handleSubmit, getValues, reset, formState: { errors }, watch } = useForm()
    const passwordVal = watch('newPassword', '')

    const onChangePassword = async (data) => {
        setLoading(true)
        try {
            await authService.resetPassword('', data.newPassword)
            toast.success('Password updated!')
            reset()
        } catch { toast.error('Failed.') }
        finally { setLoading(false) }
    }

    const togglePlatform = (k) => setPlatformConfig((p) => ({ ...p, [k]: !p[k] }))
    const toggleNotif = (k) => setNotifPrefs((p) => ({ ...p, [k]: !p[k] }))

    const SECURITY_LOG = [
        { action: 'Admin login', ip: '192.168.1.1', time: '5 min ago', status: 'success' },
        { action: 'Doctor approved', ip: '192.168.1.1', time: '1 hour ago', status: 'success' },
        { action: 'Failed login attempt', ip: '203.0.113.5', time: '3 hours ago', status: 'warning' },
        { action: 'Broadcast notification', ip: '192.168.1.1', time: '1 day ago', status: 'success' },
        { action: 'Review removed', ip: '192.168.1.1', time: '2 days ago', status: 'success' },
    ]

    return (
        <div className="max-w-2xl space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Admin Settings</h1>
                <p className="page-sub">Platform configuration and account management</p>
            </div>

            <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                            activeTab === id
                                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                                : 'text-slate-500 dark:text-slate-400'
                        )}>
                        <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                ))}
            </div>

            {/* Account */}
            {activeTab === 'account' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Admin account</h2>
                        <SettingRow label="Email address" description={user?.email}><span className="badge-success">Verified</span></SettingRow>
                        <SettingRow label="Role"><span className="badge-warning flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" />Super Admin</span></SettingRow>
                        <SettingRow label="Account created" description={memberSince.date}><span className="text-xs text-slate-400">{memberSince.relative}</span></SettingRow>
                    </div>
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Appearance</h2>
                        <SettingRow label="Dark mode" description="Switch between light and dark interface">
                            <Toggle enabled={isDark} onChange={toggleTheme} label="Toggle dark mode" />
                        </SettingRow>
                    </div>
                </div>
            )}

            {/* Platform config */}
            {activeTab === 'platform' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5 text-primary-500" /> Platform controls
                        </h2>
                        <p className="text-xs text-slate-400 mb-1">Global switches that affect all users immediately</p>
                        <SettingRow label="Maintenance mode" description="Temporarily disable the platform for all users">
                            <Toggle enabled={platformConfig.maintenanceMode} onChange={() => togglePlatform('maintenanceMode')} label="Maintenance mode" /></SettingRow>
                        <SettingRow label="New user registrations" description="Allow new users to register on the platform">
                            <Toggle enabled={platformConfig.newRegistrations} onChange={() => togglePlatform('newRegistrations')} label="New registrations" /></SettingRow>
                        <SettingRow label="Doctor self-registration" description="Allow doctors to sign up without admin invitation">
                            <Toggle enabled={platformConfig.doctorSelfRegistration} onChange={() => togglePlatform('doctorSelfRegistration')} label="Doctor self-registration" /></SettingRow>
                        <SettingRow label="Reviews & ratings" description="Allow patients to leave reviews for doctors">
                            <Toggle enabled={platformConfig.reviewsEnabled} onChange={() => togglePlatform('reviewsEnabled')} label="Reviews enabled" /></SettingRow>
                        <SettingRow label="Blog & articles" description="Allow the blog section to be visible publicly">
                            <Toggle enabled={platformConfig.blogEnabled} onChange={() => togglePlatform('blogEnabled')} label="Blog enabled" /></SettingRow>
                        <SettingRow label="Email verification required" description="Require users to verify email before accessing the platform">
                            <Toggle enabled={platformConfig.requireEmailVerification} onChange={() => togglePlatform('requireEmailVerification')} label="Email verification" /></SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Platform settings saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>
                        Save platform settings
                    </Button>
                </div>
            )}

            {/* Password */}
            {activeTab === 'password' && (
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-5">Change admin password</h2>
                    <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4" noValidate>
                        <PasswordInput label="Current password" placeholder="••••••••" required error={errors.currentPassword?.message}
                            {...register('currentPassword', { required: 'Required' })} />
                        <PasswordInput label="New password" placeholder="••••••••" required showStrength value={passwordVal} error={errors.newPassword?.message}
                            {...register('newPassword', validators.password)} />
                        <PasswordInput label="Confirm new password" placeholder="••••••••" required error={errors.confirmPassword?.message}
                            {...register('confirmPassword', { required: 'Required', validate: (v) => v === getValues('newPassword') || 'Passwords do not match' })} />
                        <Button type="submit" loading={loading} icon={<KeyIcon className="w-4 h-4" />}>Update password</Button>
                    </form>
                </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifs' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Admin notifications</h2>
                        <p className="text-xs text-slate-400 mb-1">Stay informed of key platform events</p>
                        <SettingRow label="New doctor registration" description="When a new doctor submits for approval">
                            <Toggle enabled={notifPrefs.newDoctorRegistration} onChange={() => toggleNotif('newDoctorRegistration')} label="New doctor" /></SettingRow>
                        <SettingRow label="New hospital registration" description="When a hospital submits for approval">
                            <Toggle enabled={notifPrefs.newHospitalRegistration} onChange={() => toggleNotif('newHospitalRegistration')} label="New hospital" /></SettingRow>
                        <SettingRow label="Flagged reviews" description="When a review is flagged by users">
                            <Toggle enabled={notifPrefs.flaggedReview} onChange={() => toggleNotif('flaggedReview')} label="Flagged reviews" /></SettingRow>
                        <SettingRow label="System alerts" description="Critical platform errors and downtime alerts">
                            <Toggle enabled={notifPrefs.systemAlerts} onChange={() => toggleNotif('systemAlerts')} label="System alerts" /></SettingRow>
                        <SettingRow label="Weekly digest email" description="Weekly summary of platform activity">
                            <Toggle enabled={notifPrefs.weeklyReport} onChange={() => toggleNotif('weeklyReport')} label="Weekly digest" /></SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Preferences saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>Save preferences</Button>
                </div>
            )}

            {/* Security audit log */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                            <ServerIcon className="w-5 h-5 text-primary-500" /> Security audit log
                        </h2>
                        <p className="text-xs text-slate-400 mb-4">Recent admin actions and security events</p>
                        <div className="space-y-2">
                            {SECURITY_LOG.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark">
                                    <div className="flex items-center gap-3">
                                        <span className={clsx(
                                            'w-2 h-2 rounded-full flex-shrink-0',
                                            entry.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                                        )} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{entry.action}</p>
                                            <p className="text-xs text-slate-400">IP: {entry.ip}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 flex-shrink-0">{entry.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-5 border border-red-200 dark:border-red-800">
                        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5" /> Admin danger zone
                        </h2>
                        <SettingRow label="Sign out of all sessions" description="Immediately end all admin sessions on all devices">
                            <Button variant="danger" size="sm" onClick={() => logout()}>Sign out everywhere</Button>
                        </SettingRow>
                    </div>
                </div>
            )}
        </div>
    )
}