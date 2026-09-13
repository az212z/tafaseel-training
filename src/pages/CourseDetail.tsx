import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookmarkSimple,
  Check,
  GraduationCap,
  Info,
  ArrowRight,
} from '@phosphor-icons/react'
import { BottomCTA, CourseIcon, PageHeading } from '../components/Shared'
import { useCatalog } from '../services/catalog'
import { useAuth } from '../auth/context'
import { errorMessage, money, supabase } from '../services/backend'
import { useLearning } from '../services/context'
import { arNumber } from '../services/learning'

export default function CourseDetail() {
  const { id } = useParams()
  const { courses, loading, error } = useCatalog()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const course = courses.find((c) => c.id === id)
  const { state, update, notify } = useLearning()
  if (loading)
    return (
      <div className="portal-loading" role="status">
        جارٍ تحميل البرنامج…
      </div>
    )
  if (error)
    return (
      <div className="container error-page">
        <h1>تعذّر تحميل البرنامج</h1>
        <p>تحقق من الاتصال، ثم أعد المحاولة.</p>
        <button className="button" onClick={() => location.reload()}>
          إعادة المحاولة
        </button>
      </div>
    )
  if (!course)
    return (
      <div className="container error-page">
        <h1>المسار غير موجود</h1>
        <Link to="/programs" className="button">
          تصفح البرامج <ArrowLeft />
        </Link>
      </div>
    )
  const saved = state.savedCourses.includes(course.id)
  return (
    <>
      <PageHeading eyebrow="تفاصيل البرنامج" title={course.title} description={course.short} />
      <section className="container course-detail-layout page-content">
        <div className="course-detail-main">
          <Link className="text-link back-link" to="/programs">
            <ArrowRight size={18} /> جميع البرامج
          </Link>
          <div className={`detail-banner ${course.tone}`}>
            <div className="detail-banner-pattern" />
            <CourseIcon symbol={course.symbol} size={84} />
            <div>
              <span>
                {course.category === 'شامل'
                  ? 'القدرات الكمي واللفظي'
                  : `مسار القدرات ${course.category}`}
              </span>
              <h2>{course.short}</h2>
            </div>
          </div>
          <div className="content-block">
            <h2>عن المسار</h2>
            <p>{course.description}</p>
          </div>
          {course.topics.length > 0 && (
            <div className="content-block">
              <h2>ما الذي ستتعلّمه؟</h2>
              <div className="curriculum">
                {course.topics.map((topic, i) => (
                  <div key={topic}>
                    <span>{arNumber(i + 1).padStart(2, '٠')}</span>
                    <h3>{topic}</h3>
                    <Check size={18} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {course.outcomes.length > 0 && (
            <div className="content-block">
              <h2>ما الذي ستعمل على تطويره؟</h2>
              <ul className="check-list">
                {course.outcomes.map((outcome) => (
                  <li key={outcome}>
                    <Check size={20} />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="content-block">
            <h2>كيف تستفيد من المسار؟</h2>
            <p>
              ابدأ بمراجعة المفهوم، ثم حل الأمثلة بنفسك. خصص وقتًا لمراجعة الأخطاء قبل الانتقال إلى
              مهارة جديدة، وسجّل النقاط التي تحتاج إلى إعادة شرح.
            </p>
          </div>
        </div>
        <aside className="course-enrol">
          <span className="eyebrow">خطوتك التالية</span>
          <h2>ابدأ بما يناسبك.</h2>
          <div className="enrol-detail">
            <GraduationCap size={23} />
            <span>
              المستوى<strong>{course.level}</strong>
            </span>
          </div>
          <div className="enrol-detail">
            <CourseIcon symbol={course.symbol} size={23} />
            <span>
              المحتوى
              <strong>
                {course.topics.length
                  ? `${arNumber(course.topics.length)} محاور تدريبية`
                  : 'محتوى تدريبي منظم'}
              </strong>
            </span>
          </div>
          <div className="enrol-info">
            <Info size={20} />
            <p>
              {course.price === null
                ? 'الرسوم تُحدد عند قبول طلبك.'
                : `الرسوم المعلنة: ${money(course.price)}.`}{' '}
              تختار الإدارة الدفعة المناسبة وتؤكد تفاصيل التسجيل.
            </p>
          </div>
          <button
            className="button full-width"
            disabled={busy}
            onClick={async () => {
              if (!user) {
                navigate(`/login?next=${encodeURIComponent(`/programs/${course.id}`)}`)
                return
              }
              setBusy(true)
              try {
                const { error } = await supabase.rpc('request_enrollment', { p_course: course.id })
                if (error) throw error
                notify('طلب الالتحاق مسجل في حسابك. تابع حالة القبول في كورساتي.')
                navigate('/dashboard/courses')
              } catch (e) {
                notify(errorMessage(e))
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'جارٍ إرسال الطلب…' : 'طلب الالتحاق بالكورس'}
            <ArrowLeft size={19} />
          </button>
          <button
            className="button button-outline full-width"
            aria-pressed={saved}
            onClick={() => {
              update((s) => ({
                ...s,
                savedCourses: saved
                  ? s.savedCourses.filter((x) => x !== course.id)
                  : [...s.savedCourses, course.id],
              }))
              notify(saved ? 'أُزيل المسار من محفوظاتك.' : 'تم حفظ المسار في مساحة المتدرب.')
            }}
          >
            <BookmarkSimple size={20} weight={saved ? 'fill' : 'regular'} />
            {saved ? 'المسار محفوظ' : 'احفظ المسار لوقت لاحق'}
          </button>
          <Link
            className="enrol-practice"
            to={`/practice?mode=${course.category === 'كمي' ? 'quantitative' : course.category === 'لفظي' ? 'verbal' : 'all'}`}
          >
            جرّب أسئلة من هذا المسار <ArrowLeft size={17} />
          </Link>
        </aside>
      </section>
      <BottomCTA />
    </>
  )
}
