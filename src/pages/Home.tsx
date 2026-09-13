import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpLeft, BookOpen, CheckCircle, GraduationCap } from '@phosphor-icons/react'
import { BottomCTA, CourseCard, CourseIcon, FAQ, WhatsAppLink } from '../components/Shared'
import { courseGroups } from '../data/course-catalog'
import { useCatalog } from '../services/catalog'
export default function Home() {
  const { courses, loading, error } = useCatalog()
  const featured = [
    'foundation',
    'english-foundations',
    'professional-development',
    'interior-design',
  ]
    .map((id) => courses.find((c) => c.id === id))
    .filter((c) => !!c)
  return (
    <>
      <section className="container institute-hero">
        <div className="institute-hero-copy">
          <span className="eyebrow hero-eyebrow">
            <span />
            مركز تفاصيل للتدريب
          </span>
          <h1>
            تعلّم يفتح لك
            <br />
            <span>آفاقًا أوسع.</span>
          </h1>
          <p>
            من الاستعداد للاختبارات إلى تطوير اللغة والمهارات والفنون. برامج تدريبية واضحة، تبدأ من
            احتياجك وترافق خطوتك التالية.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/programs">
              استكشف الدورات <ArrowLeft size={21} />
            </Link>
            <WhatsAppLink className="text-link">تواصل للحجز</WhatsAppLink>
          </div>
          <div className="hero-small-note">
            <CheckCircle size={18} />
            <span>اختيار الدورة، تفاصيلها وتأكيد حجزها عبر واتساب.</span>
          </div>
        </div>
        <div className="institute-hero-art">
          <div className="institute-pattern" />
          <figure className="hero-main-photo">
            <img
              src="./images/courses/interior-design.webp"
              alt="عينات خامات ومخطط يمثل بداية الفكرة في التصميم"
              width="1200"
              height="800"
              fetchPriority="high"
            />
            <figcaption>
              <span>
                معرفة تتسع.
                <br />
                <strong>ومهارات تتطور.</strong>
              </span>
              <ArrowUpLeft size={26} />
            </figcaption>
          </figure>
          <figure className="hero-small-photo">
            <img
              src="./images/courses/english-foundations.webp"
              alt="أدوات لتعلّم اللغة الإنجليزية"
              width="1200"
              height="800"
            />
            <figcaption>
              <BookOpen size={19} /> لكل بداية، أساس.
            </figcaption>
          </figure>
          <span className="hero-art-label">تعلّم بمعنى. وتقدّم بوعي.</span>
        </div>
      </section>
      <section className="container home-fields">
        <div className="section-heading">
          <div>
            <span className="eyebrow">مجالات التدريب</span>
            <h2>
              مسارات متنوعة.
              <br className="mobile-break" /> ووجهة واحدة لتطوّرك.
            </h2>
          </div>
          <Link className="text-link" to="/programs">
            جميع الدورات <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="field-grid">
          {courseGroups.map((g) => (
            <Link key={g.id} to={`/programs/category/${g.id}`} className="field-card">
              <div className="field-card-top">
                <CourseIcon symbol={g.id} size={34} />
                <span>{g.label}</span>
              </div>
              <h3>{g.title}</h3>
              <p>{g.description}</p>
              <span className="text-link">
                استكشف المجال <ArrowLeft size={19} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section container featured-courses">
        <div className="section-heading">
          <div>
            <span className="eyebrow">تعرّف على دوراتنا</span>
            <h2>خطوتك القادمة، تبدأ هنا.</h2>
            <p>لمحة من مجالاتنا. تجد جميع الدورات ومحاورها في دليل البرامج.</p>
          </div>
          <Link className="text-link" to="/programs">
            دليل الدورات <ArrowLeft size={20} />
          </Link>
        </div>
        {loading ? (
          <div className="catalog-skeleton" role="status" aria-label="جارٍ تحميل الدورات">
            <div />
            <div />
            <div />
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>تعذّر تحميل الدورات</h3>
            <button className="button button-outline" onClick={() => location.reload()}>
              إعادة المحاولة
            </button>
          </div>
        ) : featured.length ? (
          <div className="home-course-gallery">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="empty-state">تُعلن الدورات الجديدة هنا قريبًا.</div>
        )}
      </section>
      <section className="institute-method">
        <div className="container institute-method-inner">
          <div>
            <span className="eyebrow">تجربة تفاصيل</span>
            <h2>
              وضوح في الاختيار.
              <br />
              <span>اهتمام بالتعلّم.</span>
            </h2>
            <p>
              تعرف ما الذي ستتعلّمه، ولمن تناسب الدورة، وما تحتاجه قبل البداية. ثم نرتّب معك تفاصيل
              الحجز والتسجيل.
            </p>
            <Link className="text-link" to="/about">
              عن مركز تفاصيل <ArrowLeft size={19} />
            </Link>
          </div>
          <ol>
            <li>
              <span>١</span>
              <div>
                <h3>اختر ما يخدم هدفك</h3>
                <p>تصفّح المجالات، واقرأ نبذة الدورة ومحاورها والفئة المستهدفة.</p>
              </div>
            </li>
            <li>
              <span>٢</span>
              <div>
                <h3>ناقش التفاصيل وأكّد الحجز</h3>
                <p>تواصل عبر واتساب لمعرفة المواعيد والرسوم ونمط التدريب.</p>
              </div>
            </li>
            <li>
              <span>٣</span>
              <div>
                <h3>تابع تعلّمك من حسابك</h3>
                <p>بعد اعتماد تسجيلك، تجد محتواك وتقدمك وسجل دفعاتك في حسابك.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section className="container institute-account">
        <GraduationCap size={36} weight="duotone" />
        <div>
          <span className="eyebrow">للمتدربين المسجلين</span>
          <h2>كل ما يخص رحلتك، في مكان واحد.</h2>
          <p>كورساتك، دروسك، تقدمك ودفعاتك، ضمن حسابك الخاص.</p>
        </div>
        <Link className="button button-outline" to="/login">
          دخول المتدرب <ArrowLeft size={19} />
        </Link>
      </section>
      <section className="section container faq-section">
        <div>
          <span className="eyebrow">قبل أن تبدأ</span>
          <h2>تفاصيل تهمك.</h2>
          <p>إجابات مختصرة عن اختيار الدورات والحجز والتعلّم.</p>
        </div>
        <FAQ />
      </section>
      <BottomCTA />
    </>
  )
}
