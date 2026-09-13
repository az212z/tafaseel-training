import { usePlatform } from '../services/usePlatform'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  ArrowClockwise,
  ArrowLeft,
  BookOpen,
  CalendarBlank,
  ChartBar,
  ChatCircleText,
  CheckCircle,
  GraduationCap,
  Plus,
  Receipt,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react'
import { Badge, DataBoundary, Empty, Panel, PortalShell, Stat } from '../components/portal/PortalUI'
import { authEmailEnabled, dateLabel, invoicePaid, money } from '../services/backend'
import type { PlatformData } from '../services/backend'
import { arNumber } from '../services/learning'
import AdminPeople from './admin/AdminPeople'
import AdminCourses from './admin/AdminCourses'
import { AdminCohorts, AdminEnrollments } from './admin/AdminCohorts'
import AdminFinance from './admin/AdminFinance'
import AdminMessages from './admin/AdminMessages'
import { ProfileEditor } from './Dashboard'
export default function Admin() {
  const { pathname } = useLocation(),
    tab = pathname.split('/')[2] || 'overview',
    { data, loading, error, refresh } = usePlatform(true)
  const titles: Record<string, [string, string]> = {
    overview: ['كل التفاصيل، أمامك.', 'نظرة واضحة على المتدربين، الكورسات، وما يحتاج إلى متابعتك.'],
    students: ['المتدربون', 'ملف متكامل لكل متدرب، من التسجيل إلى التقدم في التعلّم.'],
    courses: ['الكورسات والدروس', 'نظّم برامج المركز وانشر محتوى يساعد المتدربين على التقدم.'],
    cohorts: ['دفعات التدريب', 'جدول منظم للقاءات التدريبية والمقاعد المتاحة.'],
    enrollments: ['التسجيلات', 'من طلب الالتحاق إلى إتاحة محتوى الكورس.'],
    billing: ['الرسوم والمدفوعات', 'تابع المستحقات والتحصيل بسجل واضح لكل حركة.'],
    messages: ['الرسائل والإعلانات', 'تواصل منظم مع المتدربين، من داخل حساباتهم.'],
    activity: ['سجل العمليات', 'أثر واضح للتعديلات الإدارية والمالية.'],
    settings: ['إعدادات الإدارة', 'حسابك، صلاحيات الوصول، والخدمات المفعّلة.'],
  }
  if (!titles[tab]) return <Navigate to="/admin" replace />
  return (
    <PortalShell
      admin
      title={titles[tab][0]}
      description={titles[tab][1]}
      action={
        <button
          className="button button-outline button-small"
          disabled={loading}
          onClick={() => void refresh()}
        >
          <ArrowClockwise size={18} /> تحديث البيانات
        </button>
      }
    >
      <DataBoundary loading={loading} error={error} retry={() => void refresh()} hasData={!!data}>
        {data && (
          <>
            {tab === 'overview' && <Overview data={data} />}{' '}
            {tab === 'students' && <AdminPeople data={data} refresh={refresh} />}{' '}
            {tab === 'courses' && <AdminCourses data={data} refresh={refresh} />}{' '}
            {tab === 'cohorts' && <AdminCohorts data={data} refresh={refresh} />}{' '}
            {tab === 'enrollments' && <AdminEnrollments data={data} refresh={refresh} />}{' '}
            {tab === 'billing' && <AdminFinance data={data} refresh={refresh} />}{' '}
            {tab === 'messages' && <AdminMessages data={data} refresh={refresh} />}{' '}
            {tab === 'activity' && <Activity data={data} />}{' '}
            {tab === 'settings' && (
              <>
                <div className="portal-two-columns">
                  <Panel title="حسابات الإدارة">
                    <div className="portal-list">
                      {data.profiles
                        .filter((p) => data.admin_users.some((a) => a.user_id === p.id))
                        .map((p) => (
                          <div className="activity-row" key={p.id}>
                            <span className="portal-icon">
                              <ShieldCheck />
                            </span>
                            <div>
                              <h3>{p.full_name}</h3>
                              <p dir="ltr">{p.email}</p>
                            </div>
                            <Badge status="active" label="مدير" />
                          </div>
                        ))}
                    </div>
                    <p className="field-hint">
                      منح صلاحية مدير جديد إجراء محمي يتم من إعدادات الخدمة الخلفية.
                    </p>
                  </Panel>
                  <Panel title="حالة الخدمات">
                    <div className="service-status">
                      <span>الحسابات وقاعدة البيانات</span>
                      <Badge status="active" label="متصلة" />
                    </div>
                    <div className="service-status">
                      <span>الدروس والمرفقات الخاصة</span>
                      <Badge status="active" label="مفعّلة" />
                    </div>
                    <div className="service-status">
                      <span>متابعة الرسوم والتحصيل</span>
                      <Badge status="active" label="مفعّلة" />
                    </div>
                    <div className="service-status">
                      <span>البريد التلقائي والاستعادة</span>
                      <Badge
                        status={authEmailEnabled ? 'active' : 'draft'}
                        label={authEmailEnabled ? 'مفعّل' : 'يحتاج إعداد خدمة البريد'}
                      />
                    </div>
                    <p className="field-hint">
                      الحسابات تعمل بالبريد وكلمة المرور. عند غياب خدمة البريد، تعيد الإدارة تعيين
                      كلمة مرور المتدرب بعد التحقق من هويته.
                    </p>
                  </Panel>
                </div>
                <ProfileEditor />
              </>
            )}
          </>
        )}
      </DataBoundary>
    </PortalShell>
  )
}
function Overview({ data }: { data: PlatformData }) {
  const students = data.profiles.filter((p) => !data.admin_users.some((a) => a.user_id === p.id)),
    pending = data.enrollments.filter((e) => e.status === 'pending'),
    openTickets = data.support_tickets.filter((t) => t.status === 'open'),
    activeCourses = data.courses.filter((c) => c.status === 'active'),
    invoices = data.invoices.filter((i) => i.status !== 'void'),
    paid = invoices.reduce((n, i) => n + invoicePaid(i, data.payments), 0),
    due = invoices.reduce(
      (n, i) => n + Math.max(0, Number(i.amount) - invoicePaid(i, data.payments)),
      0,
    ),
    months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - 5 + i)
      return {
        label: new Intl.DateTimeFormat('ar-SA', { month: 'short', calendar: 'gregory' }).format(d),
        count: students.filter((p) => {
          const created = new Date(p.created_at)
          return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()
        }).length,
      }
    }),
    max = Math.max(1, ...months.map((m) => m.count))
  return (
    <>
      <div className="portal-stats">
        <Stat
          label="إجمالي المتدربين"
          value={arNumber(students.length)}
          detail={`${arNumber(students.filter((p) => p.status === 'active').length)} حساب نشط`}
          icon={<Users />}
        />
        <Stat
          label="الكورسات النشطة"
          value={arNumber(activeCourses.length)}
          detail={`من إجمالي ${arNumber(data.courses.length)} كورسات`}
          icon={<BookOpen />}
          tone="green"
        />
        <Stat
          label="طلبات الالتحاق"
          value={arNumber(pending.length)}
          detail="تحتاج إلى مراجعة وقبول"
          icon={<GraduationCap />}
          tone="sand"
        />
        <Stat
          label="التحصيل المسجل"
          value={money(paid)}
          detail={`${money(due)} متبقية`}
          icon={<Receipt />}
          tone="slate"
        />
      </div>
      <div className="admin-action-banner">
        <div>
          <span className="eyebrow">متابعة اليوم</span>
          <h2>
            {pending.length || openTickets.length
              ? 'طلبات جديدة، وخطوة تستحق المتابعة.'
              : 'كل شيء منظم. لنجهّز الخطوة القادمة.'}
          </h2>
          <p>
            {pending.length || openTickets.length
              ? `${arNumber(pending.length)} طلبات التحاق و${arNumber(openTickets.length)} رسائل مفتوحة بانتظار الإدارة.`
              : 'أضف محتوى تدريبيًا، نظّم دفعاتك، وتابع المتدربين من مكان واحد.'}
          </p>
        </div>
        <Link
          to={
            pending.length
              ? '/admin/enrollments'
              : openTickets.length
                ? '/admin/messages'
                : '/admin/courses'
          }
          className="button"
        >
          {pending.length
            ? 'مراجعة التسجيلات'
            : openTickets.length
              ? 'فتح الرسائل'
              : 'إدارة الكورسات'}
          <ArrowLeft size={18} />
        </Link>
      </div>
      <div className="portal-two-columns overview-charts">
        <Panel
          title="نمو التسجيل"
          description="الحسابات الجديدة خلال آخر ستة أشهر"
          action={
            <span className="chart-key">
              <span /> المتدربون
            </span>
          }
        >
          <div
            className="registration-chart"
            role="img"
            aria-label={months.map((m) => `${m.label}: ${m.count} متدربين`).join('، ')}
          >
            <div className="chart-grid-lines">
              <span />
              <span />
              <span />
            </div>
            {months.map((m, i) => (
              <div className="chart-column" key={i}>
                <strong>{arNumber(m.count)}</strong>
                <div
                  className={`chart-bar ${i === 5 ? 'latest' : ''}`}
                  style={{ height: `${Math.max(m.count ? 5 : 1, (m.count / max) * 100)}%` }}
                />
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-footnote">
            <ChartBar size={17} />
            {students.length
              ? 'تعتمد الأعداد على تاريخ إنشاء الحسابات الفعلية.'
              : 'سيبدأ الرسم بالتحديث عند تسجيل أول متدرب.'}
          </div>
        </Panel>
        <Panel title="توزيع التسجيلات" description="عدد المتدربين في كل كورس">
          <div className="course-distribution">
            {activeCourses.slice(0, 5).map((c) => {
              const n = data.enrollments.filter(
                  (e) => e.course_id === c.id && ['active', 'completed'].includes(e.status),
                ).length,
                total = data.enrollments.filter((e) =>
                  ['active', 'completed'].includes(e.status),
                ).length
              return (
                <div key={c.id}>
                  <div>
                    <span>{c.title}</span>
                    <strong>
                      {arNumber(n)} <small>متدرب</small>
                    </strong>
                  </div>
                  <progress
                    max={Math.max(total, 1)}
                    value={n}
                    aria-label={`عدد المسجلين في ${c.title}`}
                  />
                </div>
              )
            })}
          </div>
          <Link className="text-link" to="/admin/enrollments">
            إدارة جميع التسجيلات <ArrowLeft size={17} />
          </Link>
        </Panel>
      </div>
      <div className="portal-two-columns">
        <Panel
          title="أحدث المتدربين"
          action={
            <Link className="text-link" to="/admin/students">
              عرض الكل <ArrowLeft size={17} />
            </Link>
          }
        >
          {students.length ? (
            <div className="portal-list">
              {students
                .slice()
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 5)
                .map((p) => (
                  <div className="activity-row" key={p.id}>
                    <span className="user-avatar">{p.full_name.charAt(0)}</span>
                    <div>
                      <h3>{p.full_name}</h3>
                      <p>{dateLabel(p.created_at)}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              title="أول متدرب، بداية الرحلة"
              description="يمكن للمتدرب إنشاء حسابه من الموقع، أو يمكنك إضافته بنفسك."
              icon={<Users size={34} />}
            >
              <Link to="/admin/students" className="button button-outline button-small">
                <Plus size={17} /> إضافة متدرب
              </Link>
            </Empty>
          )}
        </Panel>
        <Panel title="وصول سريع" description="الأعمال اليومية، في خطوات أقصر.">
          <div className="quick-actions">
            <Link to="/admin/courses">
              <span>
                <BookOpen />
              </span>
              <div>
                <strong>إدارة الكورسات والدروس</strong>
                <small>إنشاء المحتوى ونشره للمتدربين</small>
              </div>
              <ArrowLeft size={18} />
            </Link>
            <Link to="/admin/cohorts">
              <span>
                <CalendarBlank />
              </span>
              <div>
                <strong>دفعات التدريب</strong>
                <small>المواعيد والمقاعد وروابط اللقاءات</small>
              </div>
              <ArrowLeft size={18} />
            </Link>
            <Link to="/admin/billing">
              <span>
                <Receipt />
              </span>
              <div>
                <strong>متابعة التحصيل</strong>
                <small>المطالبات والدفعات وسجل السداد</small>
              </div>
              <ArrowLeft size={18} />
            </Link>
            <Link to="/admin/messages">
              <span>
                <ChatCircleText />
              </span>
              <div>
                <strong>رسائل المتدربين</strong>
                <small>{arNumber(openTickets.length)} رسائل مفتوحة</small>
              </div>
              <ArrowLeft size={18} />
            </Link>
          </div>
        </Panel>
      </div>
      <div className="admin-data-note">
        <CheckCircle size={18} />
        <span>
          الأرقام معروضة من سجلات المركز الفعلية. آخر تحديث لهذه الصفحة:{' '}
          {new Intl.DateTimeFormat('ar-SA', { timeStyle: 'short' }).format(new Date())}
        </span>
      </div>
    </>
  )
}
function Activity({ data }: { data: PlatformData }) {
  const labels: Record<string, string> = {
      INSERT: 'إضافة سجل',
      UPDATE: 'تحديث سجل',
      DELETE: 'حذف سجل',
      CREATE_ACCOUNT: 'إنشاء حساب متدرب',
      RESET_PASSWORD: 'إعادة تعيين كلمة المرور',
      UPDATE_PROFILE: 'تعديل ملف المتدرب',
      STATUS_active: 'تفعيل حساب متدرب',
      STATUS_suspended: 'إيقاف حساب متدرب',
      REPLY: 'الرد على رسالة',
    },
    tables: Record<string, string> = {
      profiles: 'المتدربون',
      courses: 'الكورسات',
      cohorts: 'دفعات التدريب',
      enrollments: 'التسجيلات',
      lessons: 'الدروس',
      invoices: 'المطالبات المالية',
      payments: 'حركات السداد',
      announcements: 'الإعلانات',
      support_tickets: 'المراسلات',
    }
  return (
    <Panel
      title="آخر العمليات"
      description="سجل لا يمكن تعديله أو حذفه من الواجهة، لمراجعة الإجراءات الإدارية."
    >
      {data.audit_logs.length ? (
        <div className="portal-table-wrap" tabIndex={0} role="region" aria-label="جدول البيانات">
          <table className="portal-table">
            <thead>
              <tr>
                <th>العملية</th>
                <th>القسم</th>
                <th>المنفذ</th>
                <th>التاريخ والوقت</th>
                <th>مرجع السجل</th>
              </tr>
            </thead>
            <tbody>
              {data.audit_logs
                .slice()
                .sort((a, b) => b.id - a.id)
                .slice(0, 100)
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{labels[a.action] || a.action}</strong>
                    </td>
                    <td>{tables[a.table_name] || a.table_name}</td>
                    <td>
                      {data.profiles.find((p) => p.id === a.actor_id)?.full_name ||
                        (a.actor_id ? 'حساب سابق' : 'تهيئة النظام')}
                    </td>
                    <td>
                      {dateLabel(a.created_at)}
                      <small>
                        {new Intl.DateTimeFormat('ar-SA', { timeStyle: 'short' }).format(
                          new Date(a.created_at),
                        )}
                      </small>
                    </td>
                    <td>
                      <code>{a.record_id?.slice(0, 8) || '—'}</code>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="لا توجد عمليات مسجلة"
          description="تظهر التعديلات هنا فور تنفيذها من الإدارة."
        />
      )}
    </Panel>
  )
}
