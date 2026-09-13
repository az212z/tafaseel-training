import { useState } from 'react'
import { CalendarBlank, PencilSimple, Plus } from '@phosphor-icons/react'
import { Badge, Empty, Modal, MutationForm, Panel } from '../../components/portal/PortalUI'
import { dateLabel, supabase } from '../../services/backend'
import type { Cohort, PlatformData } from '../../services/backend'
import { arNumber } from '../../services/learning'
import { useLearning } from '../../services/context'
import { EnrollmentFields } from './AdminPeople'
import { saveEnrollment } from '../../services/enrollment'
export function AdminCohorts({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const [editing, setEditing] = useState<Cohort | 'new' | null>(null),
    { notify } = useLearning(),
    cohort = editing && editing !== 'new' ? editing : null
  return (
    <>
      <Panel
        title="دفعات التدريب"
        description="مواعيد الدفعات، سعتها، وروابط لقاءاتها."
        action={
          <button className="button button-small" onClick={() => setEditing('new')}>
            <Plus size={18} /> إضافة دفعة
          </button>
        }
      >
        {data.cohorts.length ? (
          <div className="cohorts-grid">
            {data.cohorts.map((c) => {
              const count = data.enrollments.filter(
                (e) => e.cohort_id === c.id && ['active', 'pending', 'paused'].includes(e.status),
              ).length
              return (
                <article className="cohort-card" key={c.id}>
                  <div className="cohort-card-top">
                    <span className="portal-icon">
                      <CalendarBlank size={26} />
                    </span>
                    <Badge status={c.status} />
                    <button
                      className="icon-button"
                      onClick={() => setEditing(c)}
                      aria-label={`تعديل ${c.name}`}
                    >
                      <PencilSimple size={20} />
                    </button>
                  </div>
                  <h3>{c.name}</h3>
                  <p>{data.courses.find((x) => x.id === c.course_id)?.title}</p>
                  <div className="cohort-schedule">
                    <span>
                      {dateLabel(c.starts_at)} — {dateLabel(c.ends_at)}
                    </span>
                    <p>{c.schedule || 'لم يُحدد الجدول بعد'}</p>
                  </div>
                  <div className="course-progress-label">
                    <span>المقاعد المسجلة</span>
                    <strong>
                      {arNumber(count)} / {arNumber(c.capacity)}
                    </strong>
                  </div>
                  <progress max={c.capacity} value={count} aria-label={`إشغال مقاعد ${c.name}`} />
                </article>
              )
            })}
          </div>
        ) : (
          <Empty
            title="لا توجد دفعات تدريبية بعد"
            description="أضف دفعة، ثم اربط بها المتدربين من قائمة التسجيلات."
            icon={<CalendarBlank size={36} />}
          />
        )}
      </Panel>
      {editing && (
        <Modal
          title={editing === 'new' ? 'إضافة دفعة تدريبية' : 'تعديل الدفعة'}
          onClose={() => setEditing(null)}
        >
          <MutationForm
            onSubmit={async (f) => {
              const value = {
                course_id: f.get('course_id'),
                name: String(f.get('name')).trim(),
                starts_at: f.get('starts_at') || null,
                ends_at: f.get('ends_at') || null,
                schedule: f.get('schedule'),
                meeting_url: f.get('meeting_url'),
                capacity: Number(f.get('capacity')),
                status: f.get('status'),
              }
              if (
                value.starts_at &&
                value.ends_at &&
                String(value.ends_at) < String(value.starts_at)
              )
                throw Error('INVALID_DATES')
              const { error } = cohort
                ? await supabase.from('cohorts').update(value).eq('id', cohort.id)
                : await supabase.from('cohorts').insert(value)
              if (error) throw error
            }}
            onDone={() => {
              setEditing(null)
              void refresh()
              notify('تم حفظ الدفعة.')
            }}
          >
            <label>
              اسم الدفعة
              <input
                name="name"
                required
                minLength={2}
                maxLength={160}
                defaultValue={cohort?.name}
              />
            </label>
            <label>
              الكورس
              <select
                name="course_id"
                required
                defaultValue={cohort?.course_id}
                disabled={!!cohort}
              >
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {cohort && <input type="hidden" name="course_id" value={cohort.course_id} />}
            </label>
            <div className="form-two-col">
              <label>
                تاريخ البداية
                <input name="starts_at" type="date" defaultValue={cohort?.starts_at || ''} />
              </label>
              <label>
                تاريخ النهاية
                <input name="ends_at" type="date" defaultValue={cohort?.ends_at || ''} />
              </label>
            </div>
            <label>
              جدول اللقاءات
              <textarea
                name="schedule"
                rows={3}
                maxLength={1000}
                defaultValue={cohort?.schedule}
                placeholder="أيام اللقاءات وأوقاتها"
              />
            </label>
            <label>
              رابط اللقاء <span className="optional">اختياري</span>
              <input
                name="meeting_url"
                type="url"
                pattern="https://.*"
                dir="ltr"
                defaultValue={cohort?.meeting_url}
              />
            </label>
            <div className="form-two-col">
              <label>
                عدد المقاعد
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  max="10000"
                  required
                  defaultValue={cohort?.capacity || 30}
                />
              </label>
              <label>
                حالة الدفعة
                <select name="status" defaultValue={cohort?.status || 'upcoming'}>
                  <option value="upcoming">قادمة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                </select>
              </label>
            </div>
          </MutationForm>
        </Modal>
      )}
    </>
  )
}
export function AdminEnrollments({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const [editing, setEditing] = useState<string | null>(null),
    [filter, setFilter] = useState('all'),
    { notify } = useLearning(),
    enrollment = data.enrollments.find((e) => e.id === editing),
    rows = data.enrollments.filter((e) => filter === 'all' || e.status === filter)
  return (
    <>
      <Panel
        title="إدارة التسجيلات"
        description="اعتمد طلبات الالتحاق وحدّد الكورس والدفعة وحالة الوصول."
        action={
          <button className="button button-small" onClick={() => setEditing('new')}>
            <Plus size={18} /> تسجيل متدرب في كورس
          </button>
        }
      >
        <div className="portal-filters">
          <label>
            حالة التسجيل
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">جميع الحالات</option>
              <option value="pending">بانتظار القبول</option>
              <option value="active">نشط</option>
              <option value="paused">متوقف مؤقتًا</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </label>
        </div>
        {rows.length ? (
          <div className="portal-table-wrap" tabIndex={0} role="region" aria-label="جدول البيانات">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>المتدرب</th>
                  <th>الكورس</th>
                  <th>الدفعة</th>
                  <th>تاريخ التسجيل</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .reverse()
                  .map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>{data.profiles.find((p) => p.id === e.user_id)?.full_name}</strong>
                      </td>
                      <td>{data.courses.find((c) => c.id === e.course_id)?.title}</td>
                      <td>{data.cohorts.find((c) => c.id === e.cohort_id)?.name || 'غير محددة'}</td>
                      <td>{dateLabel(e.created_at)}</td>
                      <td>
                        <Badge status={e.status} />
                      </td>
                      <td>
                        <button className="text-link" onClick={() => setEditing(e.id)}>
                          {e.status === 'pending' ? 'مراجعة الطلب' : 'تعديل التسجيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="لا توجد تسجيلات بهذه الحالة"
            description="تظهر طلبات المتدربين هنا فور إرسالها."
          />
        )}
      </Panel>
      {editing && (
        <Modal
          title={enrollment ? 'تعديل تسجيل المتدرب' : 'إلحاق متدرب بكورس'}
          onClose={() => setEditing(null)}
        >
          <MutationForm
            onSubmit={saveEnrollment}
            onDone={() => {
              setEditing(null)
              void refresh()
              notify('تم حفظ التسجيل.')
            }}
          >
            <EnrollmentFields
              data={data}
              userId={enrollment?.user_id}
              courseId={enrollment?.course_id}
              cohortId={enrollment?.cohort_id}
              status={enrollment?.status}
            />
            <p className="field-hint">
              الحالة النشطة تفتح محتوى الكورس للمتدرب. تُضاف الرسوم من صفحة المدفوعات بشكل مستقل.
            </p>
          </MutationForm>
        </Modal>
      )}
    </>
  )
}
