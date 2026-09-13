import { usePlatform } from '../services/usePlatform'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  DownloadSimple,
  PlayCircle,
} from '@phosphor-icons/react'
import { DataBoundary, Empty, PortalShell } from '../components/portal/PortalUI'
import { downloadLessonMaterial, errorMessage, safeHttps, supabase } from '../services/backend'
import { useAuth } from '../auth/context'
import { useLearning } from '../services/context'
import { arNumber } from '../services/learning'
function embedVideo(url: string) {
  const safe = safeHttps(url)
  if (!safe) return null
  const u = new URL(safe)
  if (u.hostname === 'youtu.be' && /^[\w-]{11}$/.test(u.pathname.slice(1)))
    return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
  if (['www.youtube.com', 'youtube.com'].includes(u.hostname)) {
    const id = u.searchParams.get('v') || u.pathname.split('/').pop()
    if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
  }
  return null
}
export default function Learn() {
  const { courseId, lessonId } = useParams(),
    auth = useAuth(),
    { notify } = useLearning(),
    { data, loading, error, refresh } = usePlatform(),
    [busy, setBusy] = useState(false)
  const course = data?.courses.find((c) => c.id === courseId),
    enrollment = data?.enrollments.find((e) => e.course_id === courseId),
    lessons =
      data?.lessons
        .filter((l) => l.course_id === courseId)
        .sort((a, b) => a.position - b.position) || [],
    lesson = lessons.find((l) => l.id === lessonId) || (!lessonId ? lessons[0] : undefined),
    done =
      data?.lesson_progress.filter(
        (p) => p.completed && lessons.some((l) => l.id === p.lesson_id),
      ) || [],
    completed = done.some((p) => p.lesson_id === lesson?.id),
    index = lessons.findIndex((l) => l.id === lesson?.id),
    embed = lesson?.video_url ? embedVideo(lesson.video_url) : null
  async function complete() {
    if (!lesson || !auth.user || busy) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({ user_id: auth.user.id, lesson_id: lesson.id, completed: !completed })
      if (error) throw error
      await refresh()
      notify(completed ? 'أعيد الدرس إلى قيد التعلّم.' : 'تم تسجيل إكمال الدرس. أحسنت الاستمرار.')
    } catch (e) {
      notify(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  async function download() {
    if (!lesson?.file_path || busy) return
    setBusy(true)
    try {
      const data = await downloadLessonMaterial(lesson.id)
      const url = URL.createObjectURL(data),
        a = document.createElement('a')
      a.href = url
      a.download = lesson.file_path.split('/').pop() || 'مرفق-الدرس'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      notify(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <PortalShell
      title={course?.title || 'المحتوى التدريبي'}
      description="افهم الفكرة، طبّقها، ثم انتقل إلى الخطوة التالية."
      action={
        <Link to="/dashboard/courses" className="button button-outline button-small">
          <ArrowRight size={18} /> كورساتي
        </Link>
      }
    >
      <DataBoundary loading={loading} error={error} retry={() => void refresh()} hasData={!!data}>
        {data &&
          (!enrollment || !['active', 'completed'].includes(enrollment.status) ? (
            <Empty
              title="هذا الكورس غير متاح في حسابك"
              description="يمكنك طلب الالتحاق من صفحة كورساتي."
            />
          ) : !lessons.length ? (
            <Empty
              title="المحتوى قيد الإعداد"
              description="ستظهر الدروس هنا بعد نشرها من إدارة المركز."
            />
          ) : !lesson ? (
            <Empty title="الدرس غير موجود" description="اختر درسًا من صفحة الكورس.">
              <Link className="button" to={`/learn/${courseId}`}>
                العودة إلى الكورس
              </Link>
            </Empty>
          ) : (
            <div className="learning-layout">
              <aside className="lesson-sidebar">
                <div className="lesson-sidebar-heading">
                  <BookOpen size={25} />
                  <h2>محتوى الكورس</h2>
                  <p>
                    {arNumber(done.length)} من {arNumber(lessons.length)} دروس مكتملة
                  </p>
                  <progress
                    max={lessons.length}
                    value={done.length}
                    aria-label="نسبة إكمال الكورس"
                  />
                </div>
                {[...new Set(lessons.map((l) => l.module))].map((module) => (
                  <div className="lesson-module" key={module}>
                    <h3>{module}</h3>
                    {lessons
                      .filter((l) => l.module === module)
                      .map((l) => (
                        <Link
                          className={l.id === lesson.id ? 'current' : ''}
                          key={l.id}
                          to={`/learn/${courseId}/${l.id}`}
                        >
                          <span>
                            {done.some((p) => p.lesson_id === l.id) ? (
                              <CheckCircle weight="fill" size={21} />
                            ) : (
                              <PlayCircle size={21} />
                            )}
                          </span>
                          <div>
                            <strong>{l.title}</strong>
                            <small>{arNumber(l.duration_minutes)} دقيقة</small>
                          </div>
                        </Link>
                      ))}
                  </div>
                ))}
              </aside>
              <article className="lesson-content">
                <div className="lesson-topline">
                  <span className="eyebrow">{lesson.module}</span>
                  <span>
                    <Clock size={17} />
                    {arNumber(lesson.duration_minutes)} دقيقة
                  </span>
                </div>
                <h2>{lesson.title}</h2>
                {embed ? (
                  <div className="lesson-video">
                    <iframe
                      src={embed}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                ) : (
                  lesson.video_url && (
                    <a
                      className="lesson-external-video"
                      href={safeHttps(lesson.video_url) || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PlayCircle size={42} />
                      <span>
                        مشاهدة فيديو الدرس<small>يفتح في نافذة جديدة</small>
                      </span>
                      <ArrowLeft />
                    </a>
                  )
                )}
                <div className="lesson-prose">
                  {lesson.content
                    .split('\n')
                    .filter(Boolean)
                    .map((paragraph, i) =>
                      paragraph.startsWith('## ') ? (
                        <h3 key={i}>{paragraph.slice(3)}</h3>
                      ) : (
                        <p key={i}>{paragraph}</p>
                      ),
                    )}
                </div>
                {!lesson.content && !lesson.video_url && (
                  <p className="form-notice">لم يُضف شرح لهذا الدرس بعد.</p>
                )}
                {lesson.file_path && (
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => void download()}
                  >
                    <DownloadSimple size={20} /> تحميل مرفق الدرس
                  </button>
                )}
                <div className="lesson-complete">
                  <div>
                    <h3>{completed ? 'أنجزت هذا الدرس.' : 'هل أكملت الدرس؟'}</h3>
                    <p>
                      {completed
                        ? 'يمكنك العودة إليه للمراجعة في أي وقت.'
                        : 'سجّل إنجازك ليظهر في تقدمك داخل الكورس.'}
                    </p>
                  </div>
                  <button
                    className={`button ${completed ? 'button-outline' : ''}`}
                    disabled={busy}
                    onClick={() => void complete()}
                  >
                    <CheckCircle size={20} />
                    {busy ? 'جارٍ الحفظ…' : completed ? 'إلغاء علامة الإكمال' : 'أكملت الدرس'}
                  </button>
                </div>
                <nav className="lesson-pagination" aria-label="التنقل بين الدروس">
                  {index > 0 ? (
                    <Link className="text-link" to={`/learn/${courseId}/${lessons[index - 1].id}`}>
                      <ArrowRight size={18} /> الدرس السابق
                    </Link>
                  ) : (
                    <span />
                  )}
                  {index < lessons.length - 1 && (
                    <Link className="text-link" to={`/learn/${courseId}/${lessons[index + 1].id}`}>
                      الدرس التالي <ArrowLeft size={18} />
                    </Link>
                  )}
                </nav>
              </article>
            </div>
          ))}
      </DataBoundary>
    </PortalShell>
  )
}
