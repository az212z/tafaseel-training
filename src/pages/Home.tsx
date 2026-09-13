import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  Check,
  CheckCircle,
  Compass,
  Lightbulb,
  Target,
  TrendUp,
} from '@phosphor-icons/react'
import { BottomCTA, CourseCard, FAQ } from '../components/Shared'
import { courses, questions } from '../data/content'

function HeroQuestion() {
  const [answer, setAnswer] = useState<number | null>(null)
  const question = questions[0]
  return (
    <div className="hero-visual">
      <div className="visual-pattern" />
      <div className="visual-note">
        <span className="note-symbol">
          <Lightbulb size={26} weight="duotone" />
        </span>
        <span>
          كل فكرة تفهمها،
          <br />
          <strong>خطوة تتقدمها.</strong>
        </span>
      </div>
      <div className="question-paper">
        <div className="paper-heading">
          <span>
            <span className="tiny-mark" />
            تدريب من تفاصيل
          </span>
          <span>القدرات الكمي</span>
        </div>
        <div className="paper-title">
          <span className="eyebrow">فكّر فيها</span>
          <h2>
            الفهم أولًا.
            <br />
            <span>ثم الإجابة.</span>
          </h2>
        </div>
        <p className="hero-question-text">{question.text}</p>
        <div className="hero-options" role="group" aria-label="اختر إجابتك عن السؤال التجريبي">
          {question.options.map((option, i) => (
            <button
              key={option}
              className={answer === i ? (i === question.correct ? 'correct' : 'incorrect') : ''}
              onClick={() => setAnswer(i)}
              aria-pressed={answer === i}
            >
              {option}
              {answer === i && i === question.correct && <Check size={18} />}
            </button>
          ))}
        </div>
        <div className={`paper-footer ${answer !== null ? 'answered' : ''}`} aria-live="polite">
          {answer === null ? (
            <>
              <span>جرّب بنفسك</span>
              <ArrowUpLeft size={18} />
            </>
          ) : (
            <span>
              {answer === question.correct ? 'أحسنت. ' : 'لنراجع الفكرة. '}
              {question.explanation}
            </span>
          )}
        </div>
      </div>
      <div className="visual-stamp">
        <Compass size={31} weight="light" />
        <span>
          الفهم يصنع
          <br />
          <strong>الفرق</strong>
        </span>
      </div>
      <span className="visual-side-label">تعلّم بمعنى، وتدرّب بوعي.</span>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">
            <span />
            في تفاصيل، لكل طموح بداية
          </span>
          <h1>
            استعدادك يبدأ
            <br />
            <span>بفهمك.</span>
          </h1>
          <p>
            نرافقك في الاستعداد للقدرات، من تأسيس المفاهيم إلى التدريب الواعي. خطوة واضحة، في كل
            مرة.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/programs">
              اكتشف برامجنا <ArrowLeft size={21} />
            </Link>
            <Link className="hero-secondary" to="/practice">
              <span>
                <ArrowUpLeft size={22} />
              </span>
              جرّب التدريب
            </Link>
          </div>
        </div>
        <HeroQuestion />
      </section>
      <div className="container">
        <div className="learning-principles">
          <div>
            <Compass weight="duotone" />
            <span>تأسيس يبني فهمك</span>
          </div>
          <div>
            <BookOpen weight="duotone" />
            <span>تدريب يطوّر مهاراتك</span>
          </div>
          <div>
            <Target weight="duotone" />
            <span>مراجعة توضّح خطوتك</span>
          </div>
          <div>
            <TrendUp weight="duotone" />
            <span>تقدّم تتابعه بنفسك</span>
          </div>
        </div>
      </div>

      <section className="section container programs-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">البرامج التدريبية</span>
            <h2>
              مسارك الأنسب،
              <br className="mobile-break" /> من هنا.
            </h2>
            <p>ابدأ بالأساسيات أو ركّز على المهارة التي تحتاجها.</p>
          </div>
          <Link to="/programs" className="text-link">
            جميع البرامج <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="home-programs">
          {courses.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="method-section">
        <div className="container method-layout">
          <div className="method-intro">
            <span className="eyebrow">التعلّم في تفاصيل</span>
            <h2>
              لا تحفظ الخطوات.
              <br />
              <span>افهم ما وراءها.</span>
            </h2>
            <p>
              السؤال يتغير، والفكرة تبقى. لهذا نبني رحلة تدريب تبدأ بالفهم وتنتهي بقدرتك على
              التطبيق.
            </p>
            <Link className="text-link" to="/about">
              تعرّف على تفاصيل <ArrowLeft size={20} />
            </Link>
            <div className="method-pattern" />
          </div>
          <div className="method-steps">
            <article>
              <span className="step-icon">
                <Compass size={28} />
              </span>
              <div>
                <h3>أسّس فهمك</h3>
                <p>مفاهيم واضحة وأمثلة تربط الفكرة بطريقة الحل.</p>
              </div>
            </article>
            <article>
              <span className="step-icon">
                <BookOpen size={28} />
              </span>
              <div>
                <h3>تدرّب بوعي</h3>
                <p>طبّق ما تعلمته، واقرأ السؤال قبل اختيار الإجابة.</p>
              </div>
            </article>
            <article>
              <span className="step-icon">
                <CheckCircle size={28} />
              </span>
              <div>
                <h3>راجع وتقدّم</h3>
                <p>افهم سبب الخطأ، وحدد ما يستحق أن تعود إليه.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section container tools-section">
        <div className="section-heading">
          <div>
            <h2>تعلّم يستمر معك.</h2>
            <p>أدوات بسيطة تجعل استعدادك أكثر تنظيمًا.</p>
          </div>
        </div>
        <div className="tools-grid">
          <Link to="/dashboard" className="tool-feature">
            <div className="tool-feature-copy">
              <span className="eyebrow">مساحتك الشخصية</span>
              <h3>
                اعرف أين وصلت.
                <br />
                وما خطوتك القادمة.
              </h3>
              <p>نتائج تدريباتك، مساراتك المحفوظة، وخطة أسبوعية تتابعها بنفسك.</p>
              <span className="text-link">
                استكشف مساحة المتدرب <ArrowLeft size={20} />
              </span>
            </div>
            <div className="tool-feature-symbol">
              <TrendUp weight="thin" size={110} />
            </div>
          </Link>
          <Link to="/library" className="tool-library">
            <BookOpen size={38} weight="duotone" />
            <div>
              <h3>
                فكرة مفيدة،
                <br />
                في وقت قصير.
              </h3>
              <p>أدلة للمذاكرة، ومهارات للحل، وخطة قابلة للتحميل.</p>
            </div>
            <span className="text-link">
              تصفّح المكتبة <ArrowLeft size={20} />
            </span>
          </Link>
        </div>
      </section>

      <section className="section container faq-section">
        <div>
          <span className="eyebrow">قبل أن تبدأ</span>
          <h2>أسئلة في بالك.</h2>
          <p>إجابات واضحة تساعدك على اختيار خطوتك.</p>
          <Link className="text-link" to="/contact">
            لديك استفسار آخر؟ <ArrowLeft size={20} />
          </Link>
        </div>
        <FAQ limited />
      </section>
      <BottomCTA />
    </>
  )
}
