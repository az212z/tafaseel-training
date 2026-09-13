import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, MagnifyingGlass, X } from '@phosphor-icons/react'
import { CourseCard, WhatsAppLink } from '../components/Shared'
import { courseGroups, groupFor } from '../data/course-catalog'
import { useCatalog } from '../services/catalog'
import { arNumber } from '../services/learning'
const normalize = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase()
export default function Programs() {
  const { groupId } = useParams(),
    group = groupFor(groupId || ''),
    { courses, loading, error } = useCatalog(),
    [params, setParams] = useSearchParams(),
    search = params.get('q') || ''
  const filtered = courses.filter(
    (c) =>
      (!group || c.groupId === group.id) &&
      normalize(`${c.title} ${c.description} ${c.topics.join(' ')}`).includes(
        normalize(search.trim()),
      ),
  )
  useEffect(() => {
    document.title = `${group?.title || 'الدورات التدريبية'} | مركز تفاصيل للتدريب`
  }, [group])
  if (groupId && !group)
    return (
      <div className="container error-page">
        <h1>المجال غير موجود</h1>
        <Link className="button" to="/programs">
          جميع الدورات
        </Link>
      </div>
    )
  return (
    <>
      <section className={`container catalog-intro ${group ? 'has-cover' : ''}`}>
        <div>
          <div className="breadcrumbs">
            <Link to="/">الرئيسية</Link>
            <span>/</span>
            {group ? (
              <>
                <Link to="/programs">الدورات</Link>
                <span>/</span>
                <span>{group.title}</span>
              </>
            ) : (
              <span>الدورات التدريبية</span>
            )}
          </div>
          <span className="eyebrow">{group?.short || 'مجالات متعددة. اهتمام واحد بتطوّرك.'}</span>
          <h1>{group?.title || 'تعلّمٌ يوسّع آفاقك.'}</h1>
          <p>
            {group?.description ||
              'اختر دورتك في الاختبارات أو اللغة أو التطوير أو الفنون، وتعرّف على محتواها قبل أن تبدأ.'}
          </p>
          <div className="catalog-intro-note">
            <span>
              {loading
                ? '…'
                : arNumber(
                    (group ? courses.filter((c) => c.groupId === group.id) : courses).length,
                  )}{' '}
              دورة تدريبية
            </span>
            <span>الحجز والتأكيد عبر واتساب</span>
          </div>
        </div>
        {group && (
          <img
            className="category-cover"
            src={`./images/courses/${group.image}.webp`}
            alt={`أدوات تعبّر عن ${group.title}`}
            width="1200"
            height="800"
            fetchPriority="high"
          />
        )}
      </section>
      <section className="container catalog-content">
        <nav className="category-navigation" aria-label="مجالات الدورات">
          <Link to="/programs" aria-current={!group ? 'page' : undefined}>
            جميع الدورات
          </Link>
          {courseGroups.map((g) => (
            <Link
              key={g.id}
              to={`/programs/category/${g.id}`}
              aria-current={group?.id === g.id ? 'page' : undefined}
            >
              {g.title}
            </Link>
          ))}
        </nav>
        <div className="catalog-tools">
          <p aria-live="polite">
            {loading
              ? 'جارٍ تحميل الدورات…'
              : `${arNumber(filtered.length)} دورة${search ? ' تطابق بحثك' : ''}`}
          </p>
          <label className="search-input">
            <MagnifyingGlass size={20} />
            <input
              aria-label="ابحث عن دورة أو مهارة"
              placeholder="ابحث عن دورة أو مهارة…"
              value={search}
              onChange={(e) => {
                const next = new URLSearchParams(params)
                if (e.target.value) next.set('q', e.target.value)
                else next.delete('q')
                setParams(next, { replace: true })
              }}
            />
            {search && (
              <button className="icon-button" aria-label="مسح البحث" onClick={() => setParams({})}>
                <X size={17} />
              </button>
            )}
          </label>
        </div>
        {loading ? (
          <div className="catalog-skeleton" role="status" aria-label="جارٍ تحميل الدورات">
            <div />
            <div />
            <div />
          </div>
        ) : error ? (
          <div className="empty-state">
            <h2>تعذّر تحميل الدورات</h2>
            <p>تحقق من الاتصال، ثم أعد المحاولة.</p>
            <button className="button button-outline" onClick={() => location.reload()}>
              إعادة المحاولة
            </button>
          </div>
        ) : filtered.length ? (
          courseGroups
            .filter((g) => !group || g.id === group.id)
            .map((g) => {
              const items = filtered.filter((c) => c.groupId === g.id)
              return (
                items.length > 0 && (
                  <section className="catalog-group" key={g.id} aria-labelledby={`group-${g.id}`}>
                    <div className="catalog-group-heading">
                      <div>
                        <span className="catalog-index" aria-hidden="true">
                          {g.label}
                        </span>
                        <div>
                          <h2 id={`group-${g.id}`}>{g.title}</h2>
                          <p>{g.description}</p>
                        </div>
                      </div>
                      {!group && (
                        <Link className="text-link" to={`/programs/category/${g.id}`}>
                          استكشف المجال <ArrowLeft size={18} />
                        </Link>
                      )}
                    </div>
                    <div className="course-gallery">
                      {items.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  </section>
                )
              )
            })
        ) : (
          <div className="empty-state">
            <MagnifyingGlass size={36} />
            <h2>لا توجد دورات تطابق بحثك</h2>
            <p>جرّب اسم الدورة أو المجال، مثل «إنجليزي» أو «تصميم».</p>
            <button className="button button-outline" onClick={() => setParams({})}>
              مسح البحث
            </button>
          </div>
        )}
        <div className="catalog-advice">
          <div>
            <span className="eyebrow">نساعدك في الاختيار</span>
            <h2>تبحث عن البداية المناسبة؟</h2>
            <p>شاركنا هدفك ومستواك، لنتعرف على الدورة الأنسب لك وتفاصيلها.</p>
          </div>
          <WhatsAppLink>استفسر عبر واتساب</WhatsAppLink>
        </div>
      </section>
    </>
  )
}
