import { useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  FilePdf,
  MagnifyingGlass,
  PencilSimple,
  Plus,
} from '@phosphor-icons/react'
import { Badge, Empty, Modal, MutationForm, Panel } from '../../components/portal/PortalUI'
import { errorMessage, money, supabase } from '../../services/backend'
import type { CourseRecord, Lesson, PlatformData } from '../../services/backend'
import { useLearning } from '../../services/context'
import { courseGroups } from '../../data/course-catalog'
import { arNumber } from '../../services/learning'
export default function AdminCourses({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const { notify } = useLearning(),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [editing, setEditing] = useState<CourseRecord | 'new' | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [lessonEditing, setLessonEditing] = useState<Lesson | 'new' | null>(null),
    [uploaded, setUploaded] = useState(false)
  const courses = data.courses.filter(
      (c) => (filter === 'all' || c.status === filter) && c.title.includes(search),
    ),
    course = data.courses.find((c) => c.id === selected),
    lessons = data.lessons
      .filter((l) => l.course_id === selected)
      .sort((a, b) => a.position - b.position),
    editingCourse = editing && editing !== 'new' ? editing : null,
    editingLesson = lessonEditing && lessonEditing !== 'new' ? lessonEditing : null
  return (
    <>
      <Panel
        title="الكورسات التدريبية"
        description="تحكم في إتاحة الكورسات، محتواها، ورسومها المعلنة."
        action={
          <button className="button button-small" onClick={() => setEditing('new')}>
            <Plus size={18} /> إضافة كورس
          </button>
        }
      >
        <div className="portal-filters">
          <label className="portal-search">
            <MagnifyingGlass size={21} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن كورس"
              aria-label="البحث عن الكورسات"
            />
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="تصفية حالة الكورس"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
        <div className="admin-course-grid">
          {courses.map((c) => (
            <article className="admin-course-card" key={c.id}>
              <div className="admin-course-visual">
                <>
                  {c.image_path ? (
                    <img src={c.image_path} alt="" loading="lazy" />
                  ) : (
                    <BookOpen size={40} weight="duotone" />
                  )}
                </>
                <Badge status={c.status} />
              </div>
              <div className="admin-course-body">
                <span className="eyebrow">{c.category}</span>
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
                <div className="course-card-numbers">
                  <span>
                    {arNumber(
                      data.enrollments.filter((e) => e.course_id === c.id && e.status === 'active')
                        .length,
                    )}{' '}
                    متدرب نشط
                  </span>
                  <span>
                    {arNumber(
                      data.lessons.filter((l) => l.course_id === c.id && l.is_published).length,
                    )}{' '}
                    دروس منشورة
                  </span>
                </div>
                <div className="admin-course-bottom">
                  <span>{c.price === null ? 'الرسوم غير محددة' : money(c.price)}</span>
                  <button
                    className="icon-button"
                    aria-label={`تعديل ${c.title}`}
                    onClick={() => setEditing(c)}
                  >
                    <PencilSimple size={20} />
                  </button>
                </div>
                <button
                  className="button button-outline full-width"
                  onClick={() => setSelected(c.id)}
                >
                  إدارة المحتوى والدروس
                </button>
              </div>
            </article>
          ))}
        </div>
        {!courses.length && (
          <Empty
            title="لا توجد كورسات مطابقة"
            description="أضف كورسًا جديدًا أو غيّر خيارات البحث."
          />
        )}
      </Panel>
      {course && (
        <Modal title={`محتوى ${course.title}`} onClose={() => setSelected(null)} wide>
          <div className="inline-actions lesson-admin-toolbar">
            <p>{arNumber(lessons.length)} دروس — تُرتب حسب رقم الترتيب</p>
            <button
              className="button button-small"
              onClick={() => {
                setLessonEditing('new')
                setUploaded(false)
              }}
            >
              <Plus size={18} /> إضافة درس
            </button>
          </div>
          {lessons.length ? (
            <div className="admin-lesson-list">
              {lessons.map((l) => (
                <article key={l.id}>
                  <span className="lesson-order">{arNumber(l.position)}</span>
                  <div>
                    <small>{l.module}</small>
                    <h3>{l.title}</h3>
                    <p>
                      {arNumber(l.duration_minutes)} دقيقة {l.file_path && <FilePdf size={17} />}
                    </p>
                  </div>
                  <Badge
                    status={l.is_published ? 'active' : 'draft'}
                    label={l.is_published ? 'منشور' : 'مسودة'}
                  />
                  <button
                    className="icon-button"
                    aria-label={`تعديل درس ${l.title}`}
                    onClick={() => {
                      setLessonEditing(l)
                      setUploaded(false)
                    }}
                  >
                    <PencilSimple size={21} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="أضف أول درس في الكورس"
              description="يمكنك كتابة الشرح وإرفاق فيديو وملف تدريبي. لا يظهر الدرس للمتدرب حتى تنشره."
            />
          )}
        </Modal>
      )}
      {editing && (
        <Modal
          title={editing === 'new' ? 'إضافة كورس جديد' : 'تعديل الكورس'}
          onClose={() => setEditing(null)}
        >
          <MutationForm
            onSubmit={async (f) => {
              const value = {
                title: String(f.get('title')).trim(),
                summary: String(f.get('summary')).trim(),
                category:
                  courseGroups.find((g) => g.id === f.get('group_id'))?.title ||
                  'الاختبارات التعليمية',
                group_id: f.get('group_id'),
                is_listed: f.get('is_listed') === 'on',
                image_path: String(f.get('image_path') || '').trim(),
                sort_order: Number(f.get('sort_order') || 100),
                details: {
                  short: String(f.get('short') || ''),
                  overview: String(f.get('overview') || ''),
                  audience: String(f.get('audience') || ''),
                  prerequisites: String(f.get('prerequisites') || ''),
                  imageAlt: String(f.get('imageAlt') || ''),
                  topics: String(f.get('topics') || '')
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  outcomes: String(f.get('outcomes') || '')
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
                level: f.get('level'),
                status: f.get('status'),
                price: f.get('price') === '' ? null : Number(f.get('price')),
                duration_hours:
                  f.get('duration_hours') === '' ? null : Number(f.get('duration_hours')),
              }
              const { error } = editingCourse
                ? await supabase.from('courses').update(value).eq('id', editingCourse.id)
                : await supabase.from('courses').insert(value)
              if (error) throw error
              await refresh()
            }}
            onDone={() => {
              setEditing(null)
              notify('تم حفظ الكورس.')
            }}
          >
            <label>
              اسم الكورس
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                defaultValue={editingCourse?.title}
              />
            </label>
            <label>
              وصف مختصر
              <textarea
                name="summary"
                rows={3}
                maxLength={3000}
                defaultValue={editingCourse?.summary}
              />
            </label>
            <div className="form-two-col">
              <label>
                المسار
                <select name="group_id" defaultValue={editingCourse?.group_id || 'exams'}>
                  {courseGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                المستوى
                <input
                  name="level"
                  maxLength={100}
                  defaultValue={editingCourse?.level || 'جميع المستويات'}
                />
              </label>
            </div>
            <label>
              العبارة التعريفية
              <input
                name="short"
                maxLength={200}
                defaultValue={String(editingCourse?.details?.short || '')}
              />
            </label>
            <label>
              نبذة تفصيلية
              <textarea
                name="overview"
                rows={5}
                maxLength={3000}
                defaultValue={String(editingCourse?.details?.overview || '')}
              />
            </label>
            <label>
              الفئة المستهدفة
              <textarea
                name="audience"
                rows={2}
                maxLength={1000}
                defaultValue={String(editingCourse?.details?.audience || '')}
              />
            </label>
            <label>
              متطلبات البداية
              <textarea
                name="prerequisites"
                rows={2}
                maxLength={1000}
                defaultValue={String(editingCourse?.details?.prerequisites || '')}
              />
            </label>
            <label>
              محاور التعلّم — كل محور في سطر
              <textarea
                name="topics"
                rows={5}
                maxLength={4000}
                defaultValue={
                  Array.isArray(editingCourse?.details?.topics)
                    ? editingCourse.details.topics.join('\n')
                    : ''
                }
              />
            </label>
            <label>
              المهارات المتوقعة — كل مهارة في سطر
              <textarea
                name="outcomes"
                rows={4}
                maxLength={4000}
                defaultValue={
                  Array.isArray(editingCourse?.details?.outcomes)
                    ? editingCourse.details.outcomes.join('\n')
                    : ''
                }
              />
            </label>
            <label>
              رابط صورة الدورة
              <input
                name="image_path"
                dir="ltr"
                maxLength={2000}
                placeholder="https://…"
                defaultValue={editingCourse?.image_path || ''}
              />
            </label>
            <label>
              وصف الصورة
              <input
                name="imageAlt"
                maxLength={300}
                defaultValue={String(editingCourse?.details?.imageAlt || '')}
              />
            </label>
            <label>
              ترتيب الظهور
              <input
                name="sort_order"
                type="number"
                min="0"
                max="10000"
                defaultValue={editingCourse?.sort_order ?? 100}
              />
            </label>
            <label className="checkbox-label">
              <input
                name="is_listed"
                type="checkbox"
                defaultChecked={editingCourse?.is_listed ?? true}
              />{' '}
              إظهار الدورة في دليل البرامج
            </label>
            <div className="form-two-col">
              <label>
                الرسوم المعلنة (ر.س)
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="99999999"
                  step="0.01"
                  placeholder="غير محددة"
                  defaultValue={editingCourse?.price ?? ''}
                />
              </label>
              <label>
                الساعات التدريبية
                <input
                  name="duration_hours"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="غير محددة"
                  defaultValue={editingCourse?.duration_hours ?? ''}
                />
              </label>
            </div>
            <label>
              حالة الكورس
              <select name="status" defaultValue={editingCourse?.status || 'draft'}>
                <option value="draft">مسودة — غير متاح للمتدربين</option>
                <option value="active">نشط — متاح للتدريب والحجز عبر واتساب</option>
                <option value="archived">مؤرشف — إيقاف الإتاحة</option>
              </select>
            </label>
            <p className="field-hint">
              تعديل الرسوم المعلنة لا يغير المطالبات المالية المسجلة سابقًا.
            </p>
          </MutationForm>
        </Modal>
      )}
      {lessonEditing && course && (
        <Modal
          title={lessonEditing === 'new' ? 'إضافة درس' : 'تحرير الدرس'}
          onClose={() => setLessonEditing(null)}
          wide
        >
          <MutationForm
            onSubmit={async (f) => {
              let path = editingLesson?.file_path || '',
                newPath = ''
              const file = f.get('file') as File | null
              if (file?.size) {
                if (file.size > 20 * 1024 * 1024) throw Error('FILE_TOO_LARGE')
                if (
                  !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)
                )
                  throw Error('FILE_TYPE_NOT_ALLOWED')
                const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]
                newPath = `${course.id}/${crypto.randomUUID()}.${ext}`
                const upload = await supabase.storage
                  .from('course-materials')
                  .upload(newPath, file, {
                    upsert: false,
                    contentType: file.type,
                    cacheControl: '0',
                  })
                if (upload.error) throw upload.error
                path = newPath
                setUploaded(true)
              }
              if (f.get('remove_file') === 'on' && !newPath) path = ''
              const value = {
                course_id: course.id,
                module: String(f.get('module')).trim(),
                title: String(f.get('title')).trim(),
                content: String(f.get('content')),
                video_url: String(f.get('video_url')).trim(),
                position: Number(f.get('position')),
                duration_minutes: Number(f.get('duration_minutes')),
                is_published: f.get('is_published') === 'on',
                file_path: path,
              }
              const { error } = editingLesson
                ? await supabase.from('lessons').update(value).eq('id', editingLesson.id)
                : await supabase.from('lessons').insert(value)
              if (error) {
                if (newPath) await supabase.storage.from('course-materials').remove([newPath])
                throw error
              }
              if (editingLesson?.file_path && editingLesson.file_path !== path) {
                const removed = await supabase.storage
                  .from('course-materials')
                  .remove([editingLesson.file_path])
                if (removed.error) notify(errorMessage(removed.error))
              }
            }}
            onDone={() => {
              setLessonEditing(null)
              void refresh()
              notify('تم حفظ الدرس.')
            }}
          >
            <div className="form-two-col">
              <label>
                عنوان الدرس
                <input
                  name="title"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={editingLesson?.title}
                />
              </label>
              <label>
                اسم الوحدة
                <input
                  name="module"
                  required
                  maxLength={160}
                  defaultValue={editingLesson?.module || 'المحتوى التدريبي'}
                />
              </label>
            </div>
            <label>
              شرح الدرس
              <textarea
                className="lesson-editor"
                name="content"
                rows={12}
                maxLength={60000}
                defaultValue={editingLesson?.content}
                placeholder="اكتب الشرح، الأمثلة، وخطوات الحل. استخدم ## قبل العنوان الفرعي."
              />
            </label>
            <label>
              رابط الفيديو <span className="optional">اختياري</span>
              <input
                name="video_url"
                type="url"
                pattern="https://.*"
                dir="ltr"
                defaultValue={editingLesson?.video_url}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </label>
            <div className="form-two-col">
              <label>
                ترتيب الدرس
                <input
                  name="position"
                  type="number"
                  required
                  min="1"
                  max="10000"
                  defaultValue={editingLesson?.position || lessons.length + 1}
                />
              </label>
              <label>
                المدة التقريبية بالدقائق
                <input
                  name="duration_minutes"
                  type="number"
                  required
                  min="1"
                  max="600"
                  defaultValue={editingLesson?.duration_minutes || 10}
                />
              </label>
            </div>
            <label>
              مرفق الدرس
              <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
              <span className="field-hint">
                PDF أو صورة، حتى 20 ميجابايت. التحميل متاح للمسجلين في الكورس فقط.
              </span>
            </label>
            {uploaded && (
              <p className="field-hint">
                <CheckCircle size={16} /> اكتمل رفع المرفق
              </p>
            )}
            {editingLesson?.file_path && (
              <label className="consent-field">
                <input name="remove_file" type="checkbox" />
                <span>إزالة المرفق الحالي عند الحفظ</span>
              </label>
            )}
            <label className="consent-field">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked={editingLesson?.is_published}
              />
              <span>نشر الدرس للمتدربين المسجلين في الكورس</span>
            </label>
          </MutationForm>
        </Modal>
      )}
    </>
  )
}
