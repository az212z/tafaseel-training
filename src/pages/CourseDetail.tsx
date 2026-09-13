import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  Check,
  GraduationCap,
  Users,
  CalendarBlank,
  Phone,
} from '@phosphor-icons/react'
import { BookingLink, CourseCard } from '../components/Shared'
import { groupFor } from '../data/course-catalog'
import { useCatalog } from '../services/catalog'
import { money } from '../services/backend'
import { contact } from '../services/contact'
import { useLearning } from '../services/context'
import { arNumber } from '../services/learning'
export default function CourseDetail() {
  const { id } = useParams(),
    { courses, loading, error } = useCatalog(),
    { state, update, notify } = useLearning(),
    course = courses.find((c) => c.id === id)
  useEffect(() => {
    if (course) document.title = `${course.title} | مركز تفاصيل للتدريب`
  }, [course])
  if (['quantitative', 'verbal', 'intensive'].includes(id || ''))
    return <Navigate to="/programs/foundation" replace />
  if (loading)
    return (
      <div className="portal-loading" role="status">
        جارٍ تحميل الدورة…
      </div>
    )
  if (error)
    return (
      <div className="container error-page">
        <h1>تعذّر تحميل الدورة</h1>
        <p>تحقق من الاتصال، ثم أعد المحاولة.</p>
        <button className="button" onClick={() => location.reload()}>
          إعادة المحاولة
        </button>
      </div>
    )
  if (!course)
    return (
      <div className="container error-page">
        <h1>الدورة غير متاحة حاليًا</h1>
        <Link className="button" to="/programs">
          تصفّح الدورات <ArrowLeft />
        </Link>
      </div>
    )
  const group = groupFor(course.groupId)!,
    saved = state.savedCourses.includes(course.id),
    related = courses.filter((c) => c.groupId === course.groupId && c.id !== course.id).slice(0, 3)
  return (
    <>
      <div className="container course-page">
        <nav className="breadcrumbs" aria-label="مسار التصفح">
          <Link to="/">الرئيسية</Link>
          <span>/</span>
          <Link to="/programs">الدورات</Link>
          <span>/</span>
          <Link to={`/programs/category/${group.id}`}>{group.title}</Link>
          <span>/</span>
          <span>{course.title}</span>
        </nav>
        <section className="course-profile-hero">
          <div className="course-profile-copy">
            <Link className="eyebrow" to={`/programs/category/${group.id}`}>
              {group.title}
            </Link>
            <h1>{course.title}</h1>
            <p className="course-tagline">{course.short}</p>
            <p>{course.description}</p>
            <div className="course-profile-actions">
              <BookingLink courseId={course.id}>احجز هذه الدورة</BookingLink>
              <button
                className={`icon-button course-save ${saved ? 'saved' : ''}`}
                aria-label={saved ? `إلغاء حفظ ${course.title}` : `حفظ ${course.title}`}
                aria-pressed={saved}
                onClick={() => {
                  update((s) => ({
                    ...s,
                    savedCourses: saved
                      ? s.savedCourses.filter((x) => x !== course.id)
                      : [...s.savedCourses, course.id],
                  }))
                  notify(saved ? 'أُزيلت الدورة من محفوظاتك.' : 'أُضيفت الدورة إلى محفوظاتك.')
                }}
              >
                <BookmarkSimple size={24} weight={saved ? 'fill' : 'regular'} />
              </button>
            </div>
            <span className="booking-caption">
              أكمل النموذج، ثم أرسل طلبك عبر واتساب لتأكيد التفاصيل.
            </span>
          </div>
          <figure className="course-profile-image">
            <img
              src={course.image}
              alt={course.imageAlt}
              width="1200"
              height="800"
              fetchPriority="high"
            />
            <figcaption>
              <span>تفاصيل / {group.short}</span>
              <GraduationCap size={22} />
            </figcaption>
          </figure>
        </section>
        <div className="course-information-layout">
          <div className="course-information">
            <section>
              <span className="eyebrow">نبذة عن الدورة</span>
              <h2>معرفة واضحة، وتطبيق له هدف.</h2>
              <p>{course.overview}</p>
            </section>
            {course.topics.length > 0 && (
              <section>
                <h2>محاور التعلّم</h2>
                <div className="course-topics">
                  {course.topics.map((t, i) => (
                    <div key={t}>
                      <span>{arNumber(i + 1).padStart(2, '٠')}</span>
                      <h3>{t}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {course.outcomes.length > 0 && (
              <section>
                <h2>المهارات التي تعمل على تطويرها</h2>
                <ul className="check-list">
                  {course.outcomes.map((t) => (
                    <li key={t}>
                      <Check size={20} />
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="course-audience">
              <Users size={29} />
              <div>
                <h2>لمن هذه الدورة؟</h2>
                <p>{course.audience}</p>
                <h3>قبل البداية</h3>
                <p>{course.prerequisites}</p>
              </div>
            </section>
          </div>
          <aside className="booking-panel" aria-label="تفاصيل الحجز">
            <span className="eyebrow">خطوتك التالية</span>
            <h2>نرتّب بدايتك معك.</h2>
            <dl>
              <div>
                <dt>المستوى</dt>
                <dd>{course.level}</dd>
              </div>
              <div>
                <dt>المواعيد ونمط الحضور</dt>
                <dd>بالتنسيق مع المركز</dd>
              </div>
              <div>
                <dt>الرسوم</dt>
                <dd>{course.price === null ? 'تُوضح قبل تأكيد الحجز' : money(course.price)}</dd>
              </div>
              {course.duration_hours !== null && (
                <div>
                  <dt>الساعات التدريبية</dt>
                  <dd>{arNumber(course.duration_hours)} ساعة</dd>
                </div>
              )}
              <div>
                <dt>الحجز والتأكيد</dt>
                <dd>عبر واتساب</dd>
              </div>
            </dl>
            <BookingLink courseId={course.id}>ابدأ الحجز</BookingLink>
            <a className="booking-phone" href={`tel:${contact.phone}`}>
              <Phone size={18} />
              <bdi>{contact.displayPhone}</bdi>
            </a>
            <p>يُعتمد الحجز بعد تأكيد المركز عبر واتساب. فتح المحادثة وحده لا يؤكد الحجز.</p>
          </aside>
        </div>
        <section className="booking-steps">
          <div>
            <CalendarBlank size={28} />
            <h2>حجز واضح من أول خطوة.</h2>
          </div>
          <ol>
            <li>
              <span>١</span>
              <div>
                <h3>أكمل نموذج الحجز</h3>
                <p>تظهر الدورة مختارة تلقائيًا؛ أضف اسمك ورقم جوالك.</p>
              </div>
            </li>
            <li>
              <span>٢</span>
              <div>
                <h3>أرسل طلبك عبر واتساب</h3>
                <p>راجع الرسالة الجاهزة ببياناتك وأرسلها إلى المركز.</p>
              </div>
            </li>
            <li>
              <span>٣</span>
              <div>
                <h3>استلم تأكيدك</h3>
                <p>راجع المواعيد والرسوم والمتطلبات، واستلم تأكيد الحجز من المركز.</p>
              </div>
            </li>
          </ol>
        </section>
        {related.length > 0 && (
          <section className="related-courses">
            <div className="section-heading">
              <h2>اكتشف المزيد في هذا المجال.</h2>
              <Link className="text-link" to={`/programs/category/${group.id}`}>
                جميع دورات المجال <ArrowLeft size={19} />
              </Link>
            </div>
            <div className="course-gallery">
              {related.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}
        <Link className="text-link course-back" to="/programs">
          <ArrowRight size={18} /> العودة إلى جميع الدورات
        </Link>
      </div>
    </>
  )
}
