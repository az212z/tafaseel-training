import { saveEnrollment } from '../../services/enrollment'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, MagnifyingGlass, Plus, UserCircle, Users } from '@phosphor-icons/react'
import {
  accountAction,
  dateLabel,
  errorMessage,
  invoicePaid,
  money,
  profileSchema,
  supabase,
} from '../../services/backend'
import type { PlatformData, Profile } from '../../services/backend'
import {
  Badge,
  DownloadCsv,
  Empty,
  Modal,
  MutationForm,
  Panel,
} from '../../components/portal/PortalUI'
import { useLearning } from '../../services/context'
import { arNumber } from '../../services/learning'
export function EnrollmentFields({
  data,
  userId,
  courseId,
  cohortId,
  status,
}: {
  data: PlatformData
  userId?: string
  courseId?: string
  cohortId?: string | null
  status?: string
}) {
  const [selected, setSelected] = useState(
    courseId || data.courses.find((c) => c.status === 'active')?.id || '',
  )
  return (
    <>
      {userId ? (
        <input type="hidden" name="user_id" value={userId} />
      ) : (
        <label>
          المتدرب
          <select name="user_id" required defaultValue="">
            <option value="" disabled>
              اختر المتدرب
            </option>
            {data.profiles
              .filter((p) => !data.admin_users.some((a) => a.user_id === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.email}
                </option>
              ))}
          </select>
        </label>
      )}
      <label>
        الكورس
        <select
          name="course_id"
          required
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {data.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        دفعة التدريب
        <select
          name="cohort_id"
          key={selected}
          defaultValue={courseId === selected ? cohortId || '' : ''}
        >
          <option value="">بدون دفعة محددة</option>
          {data.cohorts
            .filter((c) => c.course_id === selected)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        حالة التسجيل
        <select name="status" defaultValue={status || 'active'}>
          <option value="active">نشط — إتاحة محتوى الكورس</option>
          <option value="pending">بانتظار القبول</option>
          <option value="paused">متوقف مؤقتًا</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
      </label>
    </>
  )
}
export default function AdminPeople({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const { notify } = useLearning(),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [create, setCreate] = useState(false),
    [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null),
    [edit, setEdit] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false),
    [enroll, setEnroll] = useState(false),
    [busy, setBusy] = useState(false)
  const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[أإآ]/g, 'ا'),
    students = data.profiles.filter((p) => !data.admin_users.some((a) => a.user_id === p.id)),
    filtered = students.filter(
      (p) =>
        (filter === 'all' || p.status === filter) &&
        normalize(`${p.full_name} ${p.email} ${p.phone}`).includes(normalize(search)),
    ),
    student = data.profiles.find((p) => p.id === selected),
    studentEnrollments = data.enrollments.filter((e) => e.user_id === selected)
  async function setStatus(p: Profile) {
    setBusy(true)
    try {
      const { error } = await supabase.rpc('admin_set_student_status', {
        p_user: p.id,
        p_status: p.status === 'active' ? 'suspended' : 'active',
      })
      if (error) throw error
      await refresh()
      notify('تم تحديث حالة المتدرب.')
    } catch (e) {
      notify(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const complete = () => {
    setEdit(false)
    setEnroll(false)
    void refresh()
    notify('تم حفظ التغييرات.')
  }
  return (
    <>
      <Panel
        title="دليل المتدربين"
        description={`${arNumber(students.length)} متدرب مسجل في المركز`}
        action={
          <div className="inline-actions">
            <DownloadCsv
              filename="متدربو-تفاصيل.csv"
              rows={[
                ['الاسم', 'البريد', 'الجوال', 'المدينة', 'الحالة', 'تاريخ التسجيل'],
                ...filtered.map((p) => [
                  p.full_name,
                  p.email,
                  p.phone,
                  p.city,
                  p.status === 'active' ? 'نشط' : 'موقوف',
                  dateLabel(p.created_at),
                ]),
              ]}
            />
            <button className="button button-small" onClick={() => setCreate(true)}>
              <Plus size={18} /> إضافة متدرب
            </button>
          </div>
        }
      >
        <div className="portal-filters">
          <label className="portal-search">
            <MagnifyingGlass size={21} />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="ابحث بالاسم، البريد، أو رقم الجوال"
              aria-label="البحث عن المتدربين"
            />
          </label>
          <select
            aria-label="تصفية حسب حالة المتدرب"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
        {filtered.length ? (
          <>
            <div
              className="portal-table-wrap"
              tabIndex={0}
              role="region"
              aria-label="جدول البيانات"
            >
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>المتدرب</th>
                    <th>رقم الجوال</th>
                    <th>الكورسات</th>
                    <th>تاريخ التسجيل</th>
                    <th>الحالة</th>
                    <th>الملف</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(page * 15, page * 15 + 15).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-person">
                          <span className="user-avatar">{p.full_name.charAt(0)}</span>
                          <span>
                            <strong>{p.full_name}</strong>
                            <small dir="ltr">{p.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <bdi>{p.phone}</bdi>
                      </td>
                      <td>
                        {arNumber(
                          data.enrollments.filter(
                            (e) => e.user_id === p.id && e.status !== 'cancelled',
                          ).length,
                        )}
                      </td>
                      <td>{dateLabel(p.created_at)}</td>
                      <td>
                        <Badge status={p.status} />
                      </td>
                      <td>
                        <button className="text-link" onClick={() => setSelected(p.id)}>
                          عرض الملف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-pagination">
              <span>{arNumber(filtered.length)} نتيجة</span>
              <div>
                <button
                  className="button button-outline button-small"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  السابق
                </button>
                <span>{arNumber(page + 1)}</span>
                <button
                  className="button button-outline button-small"
                  disabled={(page + 1) * 15 >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        ) : (
          <Empty
            title={search ? 'لا توجد نتائج مطابقة' : 'لا يوجد متدربون بعد'}
            description={
              search
                ? 'جرّب اسمًا آخر أو أزل فلتر الحالة.'
                : 'سيظهر المتدربون هنا فور إنشاء حساباتهم، ويمكنك إضافة حساب من هذه الصفحة.'
            }
            icon={<Users size={36} />}
          />
        )}
      </Panel>
      {create && (
        <Modal title="إضافة حساب متدرب" onClose={() => setCreate(false)}>
          <p className="form-notice">
            ستُنشأ كلمة مرور خاصة بالحساب، ويجب تغييرها عند أول دخول. شاركها مع المتدرب بطريقة آمنة.
          </p>
          <MutationForm
            submit="إنشاء الحساب"
            onSubmit={async (f) => {
              const parsed = profileSchema.parse({
                full_name: f.get('full_name'),
                phone: f.get('phone'),
                city: f.get('city'),
                education_level: f.get('education_level'),
              })
              const email = String(f.get('email')).trim()
              const result = await accountAction({
                action: 'create',
                profile: { ...parsed, email },
              })
              setCredentials({ email, password: result.password! })
            }}
            onDone={() => {
              setCreate(false)
              void refresh()
            }}
          >
            <ProfileFields />
            <label>
              البريد الإلكتروني
              <input
                name="email"
                required
                type="email"
                maxLength={254}
                dir="ltr"
                autoComplete="off"
              />
            </label>
          </MutationForm>
        </Modal>
      )}
      {student && (
        <Modal
          title="ملف المتدرب"
          onClose={() => {
            setSelected(null)
            setEdit(false)
            setEnroll(false)
          }}
          wide
        >
          <div className="student-detail-head">
            <span className="user-avatar large-avatar">{student.full_name.charAt(0)}</span>
            <div>
              <h3>{student.full_name}</h3>
              <p dir="ltr">{student.email}</p>
            </div>
            <Badge status={student.status} />
          </div>
          <div className="student-info-grid">
            <div>
              <span>الجوال</span>
              <strong>
                <bdi>{student.phone}</bdi>
              </strong>
            </div>
            <div>
              <span>المدينة</span>
              <strong>{student.city || 'غير محددة'}</strong>
            </div>
            <div>
              <span>المرحلة الدراسية</span>
              <strong>{student.education_level || 'غير محددة'}</strong>
            </div>
            <div>
              <span>تاريخ التسجيل</span>
              <strong>{dateLabel(student.created_at)}</strong>
            </div>
          </div>
          <div className="inline-actions detail-actions">
            <button
              className="button button-outline button-small"
              onClick={() => {
                setEdit(!edit)
                setEnroll(false)
              }}
            >
              <UserCircle size={18} /> تعديل البيانات
            </button>
            <button
              className="button button-outline button-small"
              onClick={() => {
                setEnroll(!enroll)
                setEdit(false)
              }}
            >
              <Plus size={18} /> إلحاق بكورس
            </button>
            <button
              className="button button-outline button-small"
              disabled={busy}
              onClick={() => void setStatus(student)}
            >
              {student.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
            </button>
            <button className="text-link" onClick={() => setResetConfirm(true)}>
              إعادة تعيين كلمة المرور
            </button>
          </div>
          {edit && (
            <MutationForm
              className="inset-form"
              onSubmit={async (f) => {
                const parsed = profileSchema.parse(Object.fromEntries(f))
                const { error } = await supabase.rpc('admin_update_profile', {
                  p_user: student.id,
                  p_name: parsed.full_name,
                  p_phone: parsed.phone,
                  p_city: parsed.city,
                  p_education: parsed.education_level,
                })
                if (error) throw error
              }}
              onDone={complete}
            >
              <ProfileFields profile={student} />
            </MutationForm>
          )}
          {enroll && (
            <MutationForm className="inset-form" onSubmit={saveEnrollment} onDone={complete}>
              <EnrollmentFields data={data} userId={student.id} />
            </MutationForm>
          )}
          <h3 className="subsection-title">الكورسات والتقدم</h3>
          {studentEnrollments.length ? (
            <div className="portal-list">
              {studentEnrollments.map((e) => {
                const ls = data.lessons.filter(
                    (l) => l.course_id === e.course_id && l.is_published,
                  ),
                  completed = ls.filter((l) =>
                    data.lesson_progress.some(
                      (p) => p.user_id === student.id && p.lesson_id === l.id && p.completed,
                    ),
                  ).length
                return (
                  <div className="student-detail-course" key={e.id}>
                    <div>
                      <h4>{data.courses.find((c) => c.id === e.course_id)?.title}</h4>
                      <Badge status={e.status} />
                    </div>
                    <span>
                      {arNumber(completed)} من {arNumber(ls.length)} دروس مكتملة
                    </span>
                    <progress
                      value={completed}
                      max={ls.length || 1}
                      aria-label="تقدم المتدرب في الكورس"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="field-hint">لا توجد كورسات مسجلة لهذا المتدرب.</p>
          )}
          <h3 className="subsection-title">الملخص المالي</h3>
          <div className="student-info-grid">
            {(() => {
              const invoices = data.invoices.filter(
                  (i) =>
                    i.status !== 'void' && studentEnrollments.some((e) => e.id === i.enrollment_id),
                ),
                total = invoices.reduce((n, i) => n + Number(i.amount), 0),
                paid = invoices.reduce((n, i) => n + invoicePaid(i, data.payments), 0)
              return (
                <>
                  <div>
                    <span>الرسوم</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <div>
                    <span>المسدد</span>
                    <strong>{money(paid)}</strong>
                  </div>
                  <div>
                    <span>المتبقي</span>
                    <strong>{money(total - paid)}</strong>
                  </div>
                </>
              )
            })()}
          </div>
          <Link
            className="text-link"
            to={`/admin/billing?student=${student.id}`}
            onClick={() => setSelected(null)}
          >
            عرض التفاصيل المالية
          </Link>
        </Modal>
      )}
      {resetConfirm && student && (
        <Modal title="إعادة تعيين كلمة المرور؟" onClose={() => setResetConfirm(false)}>
          <p className="form-notice">
            تحقق من هوية {student.full_name} أولًا. ستتوقف كلمة المرور الحالية، ويُلزم المتدرب
            بتغيير الكلمة الجديدة عند الدخول.
          </p>
          <MutationForm
            submit="إعادة التعيين"
            onSubmit={async () => {
              const result = await accountAction({ action: 'reset', user_id: student.id })
              setCredentials({ email: student.email, password: result.password! })
              setResetConfirm(false)
              await refresh()
            }}
          >
            <p>يُسجل هذا الإجراء باسم حساب الإدارة في سجل العمليات.</p>
          </MutationForm>
        </Modal>
      )}
      {credentials && (
        <Modal title="بيانات الدخول الجديدة" onClose={() => setCredentials(null)}>
          <div className="credentials-box">
            <CheckCircle size={32} />
            <h3>الحساب جاهز للدخول</h3>
            <p>تظهر كلمة المرور في هذه النافذة فقط. يجب تغييرها عند أول دخول.</p>
            <label>
              البريد الإلكتروني
              <input readOnly value={credentials.email} dir="ltr" />
            </label>
            <label>
              كلمة المرور
              <input readOnly value={credentials.password} dir="ltr" autoComplete="off" />
            </label>
            <button
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `البريد: ${credentials.email}\nكلمة المرور: ${credentials.password}\nالدخول: ${location.origin}${location.pathname}#/login`,
                  )
                  notify('تم نسخ بيانات الدخول.')
                } catch {
                  notify('حدّد بيانات الدخول وانسخها يدويًا.')
                }
              }}
            >
              نسخ بيانات الدخول
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
function ProfileFields({ profile }: { profile?: Profile }) {
  return (
    <>
      <label>
        الاسم الكامل
        <input
          name="full_name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={profile?.full_name}
        />
      </label>
      <label>
        رقم الجوال
        <input
          name="phone"
          type="tel"
          required
          dir="ltr"
          minLength={9}
          maxLength={20}
          defaultValue={profile?.phone}
        />
      </label>
      <div className="form-two-col">
        <label>
          المدينة
          <input name="city" maxLength={100} defaultValue={profile?.city || ''} />
        </label>
        <label>
          المرحلة الدراسية
          <select name="education_level" defaultValue={profile?.education_level || ''}>
            <option value="">غير محدد</option>
            <option>المرحلة الثانوية</option>
            <option>خريج الثانوية</option>
            <option>المرحلة الجامعية</option>
            <option>أخرى</option>
          </select>
        </label>
      </div>
    </>
  )
}
