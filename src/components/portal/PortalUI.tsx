import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowSquareOut,
  BookOpen,
  CalendarBlank,
  ChartBar,
  CircleNotch,
  Gear,
  GraduationCap,
  House,
  Receipt,
  SignOut,
  Student,
  Users,
  UserCircle,
  ChatCircleText,
  ClockCounterClockwise,
  X,
  Bell,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { Brand, ThemeToggle } from '../Shared'
import { useAuth } from '../../auth/context'
import { dateLabel, errorMessage, statusLabels } from '../../services/backend'
import { useLearning } from '../../services/context'
export function PortalShell({
  children,
  admin = false,
  title,
  description,
  action,
}: {
  children: ReactNode
  admin?: boolean
  title: string
  description?: string
  action?: ReactNode
}) {
  const auth = useAuth(),
    navigate = useNavigate(),
    { notify } = useLearning()
  const links = admin
    ? ([
        ['/admin', 'نظرة عامة', ChartBar],
        ['/admin/students', 'المتدربون', Users],
        ['/admin/courses', 'الكورسات والدروس', BookOpen],
        ['/admin/cohorts', 'دفعات التدريب', CalendarBlank],
        ['/admin/enrollments', 'التسجيلات', GraduationCap],
        ['/admin/billing', 'الرسوم والمدفوعات', Receipt],
        ['/admin/messages', 'الرسائل والإعلانات', ChatCircleText],
        ['/admin/activity', 'سجل العمليات', ClockCounterClockwise],
        ['/admin/settings', 'إعدادات الإدارة', Gear],
      ] as const)
    : ([
        ['/dashboard', 'نظرة عامة', House],
        ['/dashboard/courses', 'كورساتي', BookOpen],
        ['/dashboard/billing', 'الرسوم والدفعات', Receipt],
        ['/dashboard/support', 'التواصل مع الإدارة', ChatCircleText],
        ['/dashboard/profile', 'حسابي', UserCircle],
      ] as const)
  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <Brand compact />
        <div className="portal-workspace">
          <span className="portal-workspace-icon">{admin ? <ChartBar /> : <Student />}</span>
          <div>
            <strong>{admin ? 'إدارة المركز' : 'بوابة المتدرب'}</strong>
            <span>مركز تفاصيل للتدريب</span>
          </div>
        </div>
        <nav aria-label={admin ? 'قائمة الإدارة' : 'قائمة حسابي'}>
          {links.map(([to, label, Icon]) => (
            <NavLink end key={to} to={to}>
              <Icon size={21} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="portal-sidebar-bottom">
          {auth.isAdmin && (
            <Link to={admin ? '/dashboard' : '/admin'}>
              <Gear size={20} />
              {admin ? 'عرض حساب المتدرب' : 'لوحة الإدارة'}
            </Link>
          )}
          <Link to="/">
            <ArrowSquareOut size={20} /> زيارة الموقع
          </Link>
          <button
            onClick={async () => {
              try {
                await auth.signOut()
                navigate('/login')
              } catch (e) {
                notify(errorMessage(e))
              }
            }}
          >
            <SignOut size={20} /> تسجيل الخروج
          </button>
          <span>في التفاصيل، فرق.</span>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar">
          <span className="portal-date">{dateLabel(new Date().toISOString())}</span>
          <div className="portal-topbar-account">
            <ThemeToggle />
            <Link
              className="icon-button"
              to={admin ? '/admin/messages' : '/dashboard/support'}
              aria-label="الرسائل والتنبيهات"
            >
              <Bell size={21} />
            </Link>
            <span className="user-avatar">{auth.profile?.full_name.charAt(0)}</span>
            <span>
              <strong>{auth.profile?.full_name}</strong>
              <small>{admin ? 'إدارة المركز' : 'حساب المتدرب'}</small>
            </span>
          </div>
        </header>
        <div className="portal-content">
          <div className="portal-page-title">
            <div>
              <span className="eyebrow">{admin ? 'إدارة تفاصيل' : 'رحلتك مع تفاصيل'}</span>
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
            {action}
          </div>
          {children}
        </div>
        <footer className="portal-footer">
          <span>مركز تفاصيل للتدريب</span>
          <Link to="/privacy">الخصوصية واستخدام الموقع</Link>
        </footer>
      </div>
    </div>
  )
}
export function DataBoundary({
  loading,
  error,
  retry,
  children,
  hasData = false,
}: {
  loading: boolean
  error: string
  retry: () => void
  children: ReactNode
  hasData?: boolean
}) {
  if (error)
    return (
      <div className="portal-empty">
        <h2>تعذّر تحميل البيانات</h2>
        <p role="alert">{error}</p>
        <button className="button button-outline" onClick={retry}>
          <ArrowClockwise size={18} /> إعادة المحاولة
        </button>
      </div>
    )
  if (loading && !hasData)
    return (
      <div className="portal-loading" role="status">
        <CircleNotch className="spin" size={28} /> جارٍ تحميل البيانات…
      </div>
    )
  return (
    <>
      {loading && (
        <div className="refresh-indicator" role="status">
          جارٍ تحديث البيانات…
        </div>
      )}
      {children}
    </>
  )
}
export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      {label || statusLabels[status] || status}
    </span>
  )
}
export function Empty({
  title,
  description,
  children,
  icon = <BookOpen size={34} />,
}: {
  title: string
  description?: string
  children?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="portal-empty">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  )
}
export function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`portal-panel ${className}`}>
      {title && (
        <div className="portal-panel-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
export function Stat({
  label,
  value,
  detail,
  icon,
  tone = 'blue',
}: {
  label: string
  value: ReactNode
  detail?: string
  icon: ReactNode
  tone?: string
}) {
  return (
    <div className={`portal-stat stat-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
      <span className="stat-icon">{icon}</span>
    </div>
  )
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`portal-modal ${wide ? 'modal-wide' : ''}`}
      aria-labelledby={headingId}
      onCancel={onClose}
    >
      <div className="modal-heading">
        <h2 id={headingId}>{title}</h2>
        <button type="button" className="icon-button" aria-label="إغلاق النافذة" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function MutationForm({
  children,
  onSubmit,
  onDone,
  submit = 'حفظ التغييرات',
  className = '',
}: {
  children: ReactNode
  onSubmit: (form: FormData) => Promise<void>
  onDone?: () => void
  submit?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onSubmit(new FormData(e.currentTarget))
      onDone?.()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className={`portal-form ${className}`} onSubmit={handle}>
      <fieldset disabled={busy}>{children}</fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? 'جارٍ الحفظ…' : submit}
      </button>
    </form>
  )
}
export function DownloadCsv({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  const download = () => {
    const cell = (v: string | number) => {
      let s = String(v)
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
      return '"' + s.replaceAll('"', '""') + '"'
    }
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <button className="button button-outline button-small" onClick={download}>
      تصدير CSV
    </button>
  )
}
