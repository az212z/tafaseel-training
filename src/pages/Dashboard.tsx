import { usePlatform } from '../services/usePlatform'
import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowClockwise,
  BookOpen,
  CalendarBlank,
  CheckCircle,
  GraduationCap,
  Receipt,
  Target,
  UserCircle,
} from '@phosphor-icons/react'
import { useAuth } from '../auth/context'
import { useLearning } from '../services/context'
import { arNumber, attemptScore } from '../services/learning'
import {
  dateLabel,
  invoicePaid,
  invoiceStatus,
  money,
  paymentMethods,
  profileSchema,
  supabase,
} from '../services/backend'
import type { Invoice, PlatformData } from '../services/backend'
import {
  Badge,
  DataBoundary,
  Empty,
  Modal,
  MutationForm,
  Panel,
  PortalShell,
  Stat,
} from '../components/portal/PortalUI'
import { weekPlan } from '../data/content'
import { WhatsAppLink } from '../components/Shared'
export default function Dashboard() {
  const { pathname } = useLocation(),
    tab = pathname.split('/')[2] || 'overview',
    auth = useAuth(),
    { data, loading, error, refresh } = usePlatform(),
    { state, update, notify, syncState, retrySync } = useLearning(),
    [receipt, setReceipt] = useState<Invoice | null>(null)
  const titles: Record<string, [string, string]> = {
    overview: [
      `أهلًا، ${auth.profile?.full_name.split(' ')[0] || 'بك'}.`,
      'خطوتك التالية في التعلّم، وكل ما يخص رحلتك.',
    ],
    courses: ['كورساتي', 'محتواك التدريبي، والبرامج التي ترغب في الالتحاق بها.'],
    billing: ['الرسوم والدفعات', 'تفاصيل المستحقات وسجل المدفوعات المسجلة لدى المركز.'],
    profile: ['حسابي', 'بياناتك الشخصية وإعدادات الأمان.'],
    support: ['التواصل مع الإدارة', 'أرسل استفسارك وتابع الرد في حسابك.'],
  }
  if (!titles[tab]) return <Navigate to="/dashboard" replace />
  const enrollments = data?.enrollments || [],
    ownInvoices = (data?.invoices || []).filter((i) => i.status !== 'void'),
    outstanding = ownInvoices.reduce(
      (n, i) => n + Math.max(0, Number(i.amount) - invoicePaid(i, data?.payments || [])),
      0,
    ),
    done = data?.lesson_progress.filter((p) => p.completed).length || 0
  return (
    <PortalShell
      title={titles[tab][0]}
      description={titles[tab][1]}
      action={
        <button
          className="button button-outline button-small"
          disabled={loading}
          onClick={() => void refresh()}
        >
          <ArrowClockwise size={18} /> تحديث
        </button>
      }
    >
      <DataBoundary loading={loading} error={error} retry={() => void refresh()} hasData={!!data}>
        {data && (
          <>
            {tab === 'overview' && (
              <>
                <div className="portal-stats">
                  <Stat
                    label="كورساتي النشطة"
                    value={arNumber(enrollments.filter((e) => e.status === 'active').length)}
                    detail="مسارك نحو استعداد أفضل"
                    icon={<BookOpen />}
                  />
                  <Stat
                    label="الدروس المكتملة"
                    value={arNumber(done)}
                    detail="إنجازك المحفوظ في حسابك"
                    icon={<CheckCircle />}
                    tone="green"
                  />
                  <Stat
                    label="تدريبات مكتملة"
                    value={arNumber(state.attempts.length)}
                    detail="محاولاتك في التدريب التفاعلي"
                    icon={<Target />}
                    tone="sand"
                  />
                  <Stat
                    label="المبلغ المتبقي"
                    value={money(outstanding)}
                    detail="حسب المطالبات المسجلة"
                    icon={<Receipt />}
                    tone="slate"
                  />
                </div>
                <div className="student-welcome">
                  <div>
                    <span className="eyebrow">كل خطوة تصنع فرقًا</span>
                    <h2>
                      {enrollments.some((e) => e.status === 'active')
                        ? 'مستعد لدرس جديد؟'
                        : 'لنبدأ من المسار المناسب لك.'}
                    </h2>
                    <p>
                      {enrollments.some((e) => e.status === 'active')
                        ? 'عد إلى كورسك، وأكمل بناء فهمك خطوة بخطوة.'
                        : 'اختر دورتك وأكّد الحجز عبر واتساب. ستظهر هنا بعد اعتماد تسجيلك من المركز.'}
                    </p>
                    <Link className="button" to="/dashboard/courses">
                      {enrollments.some((e) => e.status === 'active')
                        ? 'انتقل إلى كورساتي'
                        : 'استكشف الكورسات'}
                      <ArrowLeft size={19} />
                    </Link>
                  </div>
                  <span className="welcome-mark">
                    <GraduationCap size={105} weight="light" />
                  </span>
                </div>
                <div className="portal-two-columns">
                  <Panel
                    title="تابع تعلّمك"
                    action={
                      <Link to="/dashboard/courses" className="text-link">
                        عرض الكل <ArrowLeft size={17} />
                      </Link>
                    }
                  >
                    {enrollments.length ? (
                      <div className="portal-list">
                        {enrollments.slice(0, 3).map((e) => {
                          const course = data.courses.find((c) => c.id === e.course_id),
                            lessons = data.lessons.filter((l) => l.course_id === e.course_id),
                            completed = lessons.filter((l) =>
                              data.lesson_progress.some((p) => p.lesson_id === l.id && p.completed),
                            ).length
                          return (
                            <div key={e.id} className="student-course-row">
                              <span className="portal-icon">
                                <BookOpen />
                              </span>
                              <div>
                                <h3>{course?.title || 'كورس مؤرشف'}</h3>
                                <Badge status={e.status} />
                                {lessons.length > 0 && (
                                  <progress
                                    aria-label={`تقدم ${course?.title}`}
                                    max={lessons.length}
                                    value={completed}
                                  />
                                )}
                              </div>
                              {['active', 'completed'].includes(e.status) && lessons.length > 0 && (
                                <Link
                                  to={`/learn/${e.course_id}`}
                                  className="icon-button"
                                  aria-label={`فتح ${course?.title}`}
                                >
                                  <ArrowLeft />
                                </Link>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <Empty
                        title="رحلتك تبدأ بكورس"
                        description="ستجد دوراتك هنا بعد تأكيد حجزك واعتماد تسجيلك من المركز."
                      />
                    )}
                  </Panel>
                  <Panel title="آخر الإعلانات" description="تحديثات المركز والكورسات الخاصة بك">
                    {data.announcements.length ? (
                      <div className="portal-list">
                        {data.announcements
                          .slice()
                          .reverse()
                          .slice(0, 4)
                          .map((a) => (
                            <article key={a.id} className="announcement">
                              <small>{dateLabel(a.created_at)}</small>
                              <h3>{a.title}</h3>
                              <p>{a.body}</p>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <Empty
                        title="لا توجد إعلانات جديدة"
                        description="ستظهر تنبيهات الإدارة هنا عند نشرها."
                        icon={<CalendarBlank size={32} />}
                      />
                    )}
                  </Panel>
                </div>
                <div className="portal-two-columns">
                  <Panel
                    title="خطتك لهذا الأسبوع"
                    description="علّم على الجلسة عند إكمالها."
                    action={
                      <span className={`sync-state ${syncState === 'error' ? 'error' : ''}`}>
                        {syncState === 'saving'
                          ? 'جارٍ الحفظ'
                          : syncState === 'loading'
                            ? 'جارٍ التحميل'
                            : syncState === 'error'
                              ? 'تعذّر الحفظ'
                              : 'محفوظة في حسابك'}
                        {syncState === 'error' && (
                          <button className="text-link" onClick={retrySync}>
                            إعادة المحاولة
                          </button>
                        )}
                      </span>
                    }
                  >
                    <div className="student-plan">
                      {weekPlan.map((day, i) => (
                        <label key={day.day}>
                          <input
                            type="checkbox"
                            checked={state.plan.includes(i)}
                            onChange={() =>
                              update((s) => ({
                                ...s,
                                plan: s.plan.includes(i)
                                  ? s.plan.filter((x) => x !== i)
                                  : [...s.plan, i],
                              }))
                            }
                          />
                          <span>{day.day}</span>
                          <strong>{day.title}</strong>
                        </label>
                      ))}
                    </div>
                  </Panel>
                  <Panel
                    title="سجل التدريب"
                    action={
                      <Link to="/practice" className="text-link">
                        تدريب جديد <ArrowLeft size={17} />
                      </Link>
                    }
                  >
                    {state.attempts.length ? (
                      <div className="portal-list">
                        {state.attempts
                          .slice()
                          .reverse()
                          .slice(0, 6)
                          .map((a) => (
                            <div className="activity-row" key={a.id}>
                              <span className="portal-icon">
                                <Target />
                              </span>
                              <div>
                                <h3>
                                  تدريب{' '}
                                  {a.questionIds.length === 8
                                    ? 'كمي ولفظي'
                                    : a.questionIds[0] === 'q1'
                                      ? 'كمي'
                                      : 'لفظي'}
                                </h3>
                                <p>{dateLabel(a.date)}</p>
                              </div>
                              <strong>
                                {arNumber(attemptScore(a))} / {arNumber(a.questionIds.length)}
                              </strong>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Empty
                        title="ابدأ أول تدريب"
                        description="راجع إجاباتك وتابع نتائج محاولاتك من هنا."
                        icon={<Target size={34} />}
                      >
                        <Link to="/practice" className="button button-outline">
                          جرّب التدريب
                        </Link>
                      </Empty>
                    )}
                  </Panel>
                </div>
              </>
            )}
            {tab === 'courses' && (
              <>
                <Panel
                  title="الكورسات المسجلة"
                  description="حالة القبول، دفعة التدريب، وتقدمك في كل كورس."
                >
                  {enrollments.length ? (
                    <div className="student-courses-grid">
                      {enrollments.map((e) => {
                        const c = data.courses.find((c) => c.id === e.course_id),
                          cohort = data.cohorts.find((c) => c.id === e.cohort_id),
                          lessons = data.lessons.filter((l) => l.course_id === e.course_id),
                          count = lessons.filter((l) =>
                            data.lesson_progress.some((p) => p.lesson_id === l.id && p.completed),
                          ).length
                        return (
                          <article className="enrolled-card" key={e.id}>
                            <div className="enrolled-card-art">
                              <BookOpen size={46} weight="duotone" />
                              <Badge status={e.status} />
                            </div>
                            <div className="enrolled-card-body">
                              <span className="eyebrow">{c?.category || 'كورس تدريبي'}</span>
                              <h3>{c?.title || 'كورس مؤرشف'}</h3>
                              {cohort && (
                                <div className="cohort-note">
                                  <strong>
                                    <CalendarBlank size={17} /> {cohort.name}
                                  </strong>
                                  <p>{cohort.schedule || 'يُحدد جدول اللقاءات من الإدارة.'}</p>
                                  <small>
                                    {dateLabel(cohort.starts_at)} — {dateLabel(cohort.ends_at)}
                                  </small>
                                  {cohort.meeting_url &&
                                    ['active', 'completed'].includes(e.status) && (
                                      <a
                                        className="text-link"
                                        href={cohort.meeting_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        رابط اللقاء التدريبي <ArrowLeft size={16} />
                                      </a>
                                    )}
                                </div>
                              )}
                              {['active', 'completed'].includes(e.status) ? (
                                <>
                                  <div className="course-progress-label">
                                    <span>التقدم في الكورس</span>
                                    <strong>
                                      {arNumber(
                                        lessons.length
                                          ? Math.round((count / lessons.length) * 100)
                                          : 0,
                                      )}
                                      ٪
                                    </strong>
                                  </div>
                                  <progress
                                    value={count}
                                    max={lessons.length || 1}
                                    aria-label={`التقدم في ${c?.title}`}
                                  />
                                  <Link className="button full-width" to={`/learn/${e.course_id}`}>
                                    الدخول إلى الكورس <ArrowLeft size={18} />
                                  </Link>
                                </>
                              ) : (
                                <p className="field-hint">
                                  {e.status === 'pending'
                                    ? 'طلبك لدى الإدارة. سيُفتح المحتوى بعد قبول التسجيل.'
                                    : 'تواصل مع الإدارة للاستفسار عن حالة الكورس.'}
                                </p>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty
                      title="لم تسجّل في كورس بعد"
                      description="اختر أحد الكورسات المتاحة أدناه وأرسل طلبك."
                    />
                  )}
                </Panel>
                <Panel
                  title="اكتشف مسارك التالي"
                  description="راجع الدورة، ثم تواصل عبر واتساب لتأكيد الموعد والرسوم والحجز."
                >
                  <div className="catalog-grid">
                    {data.courses
                      .filter(
                        (c) =>
                          c.status === 'active' &&
                          c.is_listed !== false &&
                          !enrollments.some((e) => e.course_id === c.id),
                      )
                      .map((c) => (
                        <article className="catalog-card" key={c.id}>
                          <span className="portal-icon">
                            <GraduationCap size={26} />
                          </span>
                          <h3>{c.title}</h3>
                          <p>{c.summary}</p>
                          <div>
                            <span>
                              {c.price === null ? 'الرسوم تُحدد عند القبول' : money(c.price)}
                            </span>
                            <WhatsAppLink
                              className="button button-outline button-small"
                              courseTitle={c.title}
                            >
                              احجز عبر واتساب
                            </WhatsAppLink>
                          </div>
                        </article>
                      ))}
                  </div>
                  {data.courses.every((c) => enrollments.some((e) => e.course_id === c.id)) && (
                    <Empty
                      title="اطلعت على جميع الكورسات المتاحة"
                      description="ستظهر البرامج الجديدة هنا عند إضافتها."
                    />
                  )}
                </Panel>
              </>
            )}
            {tab === 'billing' && (
              <>
                <div className="portal-stats three-stats">
                  <Stat
                    label="إجمالي الرسوم"
                    value={money(ownInvoices.reduce((n, i) => n + Number(i.amount), 0))}
                    icon={<Receipt />}
                  />
                  <Stat
                    label="إجمالي المسدد"
                    value={money(
                      ownInvoices.reduce((n, i) => n + invoicePaid(i, data.payments), 0),
                    )}
                    icon={<CheckCircle />}
                    tone="green"
                  />
                  <Stat
                    label="المتبقي"
                    value={money(outstanding)}
                    icon={<CalendarBlank />}
                    tone="sand"
                  />
                </div>
                <div className="form-notice">
                  تُحدّث الإدارة السداد بعد التحقق من التحصيل. هذه الصفحة تعرض سجلك المالي ولا تنفّذ
                  دفعًا إلكترونيًا.
                </div>
                <Panel title="جدول المستحقات">
                  {data.invoices.length ? (
                    <div
                      className="portal-table-wrap"
                      tabIndex={0}
                      role="region"
                      aria-label="جدول البيانات"
                    >
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>المطالبة</th>
                            <th>موعد الاستحقاق</th>
                            <th>المبلغ</th>
                            <th>المسدد</th>
                            <th>الحالة</th>
                            <th>التفاصيل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.invoices.map((i) => (
                            <tr key={i.id}>
                              <td>
                                <strong>{i.title}</strong>
                                <small>
                                  {
                                    data.courses.find(
                                      (c) =>
                                        c.id ===
                                        enrollments.find((e) => e.id === i.enrollment_id)
                                          ?.course_id,
                                    )?.title
                                  }
                                </small>
                              </td>
                              <td>{dateLabel(i.due_date)}</td>
                              <td>{money(i.amount)}</td>
                              <td>{money(invoicePaid(i, data.payments))}</td>
                              <td>
                                <Badge
                                  status={
                                    invoiceStatus(i, data.payments) === 'مسددة'
                                      ? 'completed'
                                      : i.status === 'void'
                                        ? 'void'
                                        : 'pending'
                                  }
                                  label={invoiceStatus(i, data.payments)}
                                />
                              </td>
                              <td>
                                <button className="text-link" onClick={() => setReceipt(i)}>
                                  عرض السجل
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="لا توجد رسوم مسجلة"
                      description="تظهر المطالبات ومواعيد الأقساط هنا بعد إضافتها من الإدارة."
                      icon={<Receipt size={34} />}
                    />
                  )}
                </Panel>
              </>
            )}
            {tab === 'profile' && <ProfileEditor />}
            {tab === 'support' && (
              <div className="portal-two-columns support-columns">
                <Panel
                  title="رسالة جديدة"
                  description="اكتب استفسارك بوضوح، وستجد رد الإدارة في هذه الصفحة."
                >
                  <MutationForm
                    submit="إرسال الرسالة"
                    onSubmit={async (f) => {
                      const { error } = await supabase.rpc('submit_ticket', {
                        p_subject: f.get('subject'),
                        p_body: f.get('body'),
                      })
                      if (error) throw error
                    }}
                    onDone={() => {
                      notify('تم إرسال رسالتك إلى الإدارة.')
                      void refresh()
                    }}
                  >
                    <label>
                      الموضوع
                      <input name="subject" required minLength={2} maxLength={160} />
                    </label>
                    <label>
                      الرسالة
                      <textarea name="body" required minLength={5} maxLength={4000} rows={6} />
                    </label>
                  </MutationForm>
                </Panel>
                <Panel title="مراسلاتي">
                  {data.support_tickets.length ? (
                    <div className="portal-list">
                      {data.support_tickets
                        .slice()
                        .reverse()
                        .map((t) => (
                          <article className="ticket-card" key={t.id}>
                            <div>
                              <h3>{t.subject}</h3>
                              <Badge status={t.status} />
                            </div>
                            <small>{dateLabel(t.created_at)}</small>
                            <p>{t.body}</p>
                            {t.reply ? (
                              <div className="ticket-reply">
                                <strong>رد الإدارة</strong>
                                <p>{t.reply}</p>
                              </div>
                            ) : (
                              <span className="field-hint">بانتظار رد الإدارة</span>
                            )}
                          </article>
                        ))}
                    </div>
                  ) : (
                    <Empty
                      title="لا توجد مراسلات سابقة"
                      description="يمكنك التواصل مع الإدارة من النموذج المجاور."
                    />
                  )}
                </Panel>
              </div>
            )}
            {receipt && (
              <Modal title="السجل المالي" onClose={() => setReceipt(null)} wide>
                <ReceiptDetail invoice={receipt} data={data} />
              </Modal>
            )}
          </>
        )}
      </DataBoundary>
    </PortalShell>
  )
}
export function ProfileEditor() {
  const auth = useAuth(),
    { notify } = useLearning()
  return (
    <div className="portal-two-columns profile-columns">
      <Panel title="البيانات الشخصية" description="حدّث معلوماتك لتسهيل التواصل ومتابعة التسجيل.">
        <MutationForm
          onSubmit={async (form) => {
            const parsed = profileSchema.safeParse(Object.fromEntries(form))
            if (!parsed.success) throw new Error('تحقق من بياناتك')
            const { error } = await supabase.rpc('update_my_profile', {
              p_name: parsed.data.full_name,
              p_phone: parsed.data.phone,
              p_city: parsed.data.city,
              p_education: parsed.data.education_level,
            })
            if (error) throw error
            await auth.refresh()
          }}
          onDone={() => notify('تم حفظ بياناتك.')}
        >
          <label>
            الاسم الكامل
            <input
              name="full_name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={auth.profile?.full_name}
            />
          </label>
          <label>
            البريد الإلكتروني
            <input type="email" value={auth.profile?.email || ''} disabled dir="ltr" />
            <span className="field-hint">البريد هو معرّف تسجيل الدخول. لتغييره، راجع الإدارة.</span>
          </label>
          <label>
            رقم الجوال
            <input
              name="phone"
              type="tel"
              dir="ltr"
              required
              minLength={9}
              maxLength={20}
              defaultValue={auth.profile?.phone}
            />
          </label>
          <div className="form-two-col">
            <label>
              المدينة
              <input name="city" maxLength={100} defaultValue={auth.profile?.city} />
            </label>
            <label>
              المرحلة الدراسية
              <select name="education_level" defaultValue={auth.profile?.education_level}>
                <option value="">غير محدد</option>
                <option>المرحلة الثانوية</option>
                <option>خريج الثانوية</option>
                <option>المرحلة الجامعية</option>
                <option>أخرى</option>
              </select>
            </label>
          </div>
        </MutationForm>
      </Panel>
      <Panel title="أمان الحساب" description="استخدم كلمة مرور قوية واحتفظ بها لنفسك.">
        <MutationForm
          submit="تحديث كلمة المرور"
          onSubmit={async (f) => {
            if (f.get('new_password') !== f.get('confirm_password')) throw Error('weak_password')
            const verify = await supabase.auth.signInWithPassword({
              email: auth.profile!.email,
              password: String(f.get('current_password')),
            })
            if (verify.error) throw verify.error
            const { error } = await supabase.auth.updateUser({
              password: String(f.get('new_password')),
            })
            if (error) throw error
            await supabase.auth.signOut({ scope: 'others' })
          }}
          onDone={() => notify('تم تحديث كلمة المرور وتسجيل الخروج من الجلسات الأخرى.')}
        >
          <label>
            كلمة المرور الحالية
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
            />
          </label>
          <label>
            كلمة المرور الجديدة
            <input
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              dir="ltr"
            />
          </label>
          <p className="field-hint">
            10 أحرف على الأقل، تشمل حرفًا إنجليزيًا كبيرًا وصغيرًا ورقمًا.
          </p>
          <label>
            تأكيد كلمة المرور الجديدة
            <input
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              dir="ltr"
            />
          </label>
        </MutationForm>
        <div className="profile-security-note">
          <UserCircle size={23} />
          <p>على الأجهزة المشتركة، سجّل الخروج بعد الانتهاء لحماية بياناتك.</p>
        </div>
      </Panel>
    </div>
  )
}
export function ReceiptDetail({ invoice, data }: { invoice: Invoice; data: PlatformData }) {
  const enrollment = data.enrollments.find((e) => e.id === invoice.enrollment_id),
    student = data.profiles.find((p) => p.id === enrollment?.user_id),
    payments = data.payments.filter((p) => p.invoice_id === invoice.id)
  return (
    <div className="receipt-document">
      <div className="receipt-brand">
        <strong>تفاصيل</strong>
        <span>مركز تفاصيل للتدريب</span>
      </div>
      <h3>{invoice.title}</h3>
      <p>كشف متابعة الرسوم — لا يُعد فاتورة ضريبية</p>
      <dl>
        <div>
          <dt>المتدرب</dt>
          <dd>{student?.full_name}</dd>
        </div>
        <div>
          <dt>الكورس</dt>
          <dd>{data.courses.find((c) => c.id === enrollment?.course_id)?.title}</dd>
        </div>
        <div>
          <dt>رقم المرجع</dt>
          <dd dir="ltr">{invoice.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>موعد الاستحقاق</dt>
          <dd>{dateLabel(invoice.due_date)}</dd>
        </div>
        <div>
          <dt>المبلغ المطلوب</dt>
          <dd>{money(invoice.amount)}</dd>
        </div>
        <div>
          <dt>المسدد</dt>
          <dd>{money(invoicePaid(invoice, data.payments))}</dd>
        </div>
        <div>
          <dt>المتبقي</dt>
          <dd>
            {money(
              invoice.status === 'void'
                ? 0
                : Math.max(0, Number(invoice.amount) - invoicePaid(invoice, data.payments)),
            )}
          </dd>
        </div>
      </dl>
      {payments.map((p) => (
        <div className="receipt-payment" key={p.id}>
          <strong>
            {money(p.amount)} <Badge status={p.status} />
          </strong>
          <p>
            {paymentMethods[p.method]} · {dateLabel(p.created_at)}
          </p>
          {p.reference && <small>المرجع: {p.reference}</small>}
        </div>
      ))}
      <button className="button button-outline no-print" onClick={() => window.print()}>
        طباعة السجل
      </button>
    </div>
  )
}
