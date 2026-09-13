import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  BookmarkSimple,
  Calculator,
  Check,
  Compass,
  GraduationCap,
  List,
  Moon,
  Plus,
  Sun,
  Target,
  X,
} from '@phosphor-icons/react'
import { faqs } from '../data/content'
import type { Course } from '../data/content'
import { useAuth } from '../auth/context'
import { useLearning } from '../services/context'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${compact ? 'compact' : ''}`}
      aria-label="تفاصيل، الصفحة الرئيسية"
    >
      <span className="brand-mark">
        <img src="./brand/logo-small.webp" alt="" width="1280" height="1136" />
      </span>
      <span className="brand-name">
        تفاصيل<span>مركز تفاصيل للتدريب</span>
      </span>
    </Link>
  )
}

export function Header() {
  const { user, isAdmin } = useAuth()
  const accountPath = user ? (isAdmin ? '/admin' : '/dashboard') : '/login'
  const accountLabel = user ? (isAdmin ? 'لوحة الإدارة' : 'حسابي') : 'تسجيل الدخول'
  const [menu, setMenu] = useState(false)
  const navigation = [
    ['/', 'الرئيسية'],
    ['/programs', 'برامجنا'],
    ['/about', 'عن تفاصيل'],
    ['/library', 'مكتبة التعلّم'],
    ['/contact', 'تواصل معنا'],
  ]
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav
          aria-label="القائمة الرئيسية"
          id="main-navigation"
          className={menu ? 'main-nav open' : 'main-nav'}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMenu(false)
              document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus()
            }
          }}
        >
          {navigation.map(([to, label]) => (
            <NavLink end={to === '/'} key={to} to={to} onClick={() => setMenu(false)}>
              {label}
            </NavLink>
          ))}
          <Link className="mobile-account" to={accountPath} onClick={() => setMenu(false)}>
            {accountLabel} <ArrowUpLeft size={18} />
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link className="button button-small header-account" to={accountPath}>
            {accountLabel} <ArrowUpLeft size={17} />
          </Link>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menu}
            aria-controls="main-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <List />}
          </button>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Brand />
          <p>
            نفهم التفاصيل.
            <br />
            لنصل إلى الصورة الأوضح.
          </p>
        </div>
        <div>
          <h3>اكتشف تفاصيل</h3>
          <Link to="/programs">البرامج التدريبية</Link>
          <Link to="/about">عن المركز</Link>
          <Link to="/contact">تواصل معنا</Link>
        </div>
        <div>
          <h3>رحلتك في التعلّم</h3>
          <Link to="/practice">التدريب التفاعلي</Link>
          <Link to="/library">مكتبة التعلّم</Link>
          <Link to="/dashboard">حساب المتدرب</Link>
        </div>
        <div className="footer-message">
          <span className="eyebrow">خطوتك القادمة</span>
          <h3>ابدأ بفهم مهاراتك.</h3>
          <Link to="/practice" className="text-link">
            جرّب التدريب <ArrowLeft size={20} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} مركز تفاصيل للتدريب</span>
        <Link to="/privacy">الخصوصية واستخدام الموقع</Link>
        <span className="footer-signature">في التفاصيل، فرق.</span>
      </div>
    </footer>
  )
}

export function CourseIcon({ symbol, size = 36 }: { symbol: string; size?: number }) {
  if (symbol === 'math') return <Calculator size={size} weight="duotone" />
  if (symbol === 'verbal') return <BookOpen size={size} weight="duotone" />
  if (symbol === 'target') return <Target size={size} weight="duotone" />
  return <Compass size={size} weight="duotone" />
}

export function CourseCard({ course }: { course: Course }) {
  const { state, update, notify } = useLearning()
  const saved = state.savedCourses.includes(course.id)
  const save = () => {
    update((s) => ({
      ...s,
      savedCourses: saved
        ? s.savedCourses.filter((id) => id !== course.id)
        : [...s.savedCourses, course.id],
    }))
    notify(saved ? 'أُزيل المسار من محفوظاتك.' : 'أُضيف المسار إلى محفوظاتك.')
  }
  return (
    <article className={`course-card ${course.tone}`}>
      <div className="course-art">
        <div className="course-art-pattern" />
        <span className="course-art-icon">
          <CourseIcon symbol={course.symbol} size={52} />
        </span>
        <span className="course-art-type">
          {course.category === 'كمي'
            ? 'س + ص'
            : course.category === 'لفظي'
              ? 'أ ب ج'
              : course.id === 'intensive'
                ? 'فهم. تطبيق. إتقان.'
                : 'لكل بداية، أساس.'}
        </span>
      </div>
      <div className="course-body">
        <div className="course-meta">
          <span>{course.category === 'شامل' ? 'كمي ولفظي' : `مسار ${course.category}`}</span>
          <button
            className={`icon-button bookmark ${saved ? 'saved' : ''}`}
            aria-label={saved ? `إلغاء حفظ ${course.title}` : `حفظ ${course.title}`}
            aria-pressed={saved}
            onClick={save}
          >
            <BookmarkSimple size={21} weight={saved ? 'fill' : 'regular'} />
          </button>
        </div>
        <h3>
          <Link to={`/programs/${course.id}`}>{course.title}</Link>
        </h3>
        <p>{course.description}</p>
        <div className="course-bottom">
          <span>
            <GraduationCap size={18} />
            {course.level}
          </span>
          <Link className="text-link" to={`/programs/${course.id}`}>
            اكتشف المسار <ArrowLeft size={18} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function FAQ({ limited = false }: { limited?: boolean }) {
  return (
    <div className="faq-list">
      {(limited ? faqs.slice(0, 4) : faqs).map(({ q, a }) => (
        <details key={q}>
          <summary>
            {q}
            <Plus size={22} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="page-heading container">
      <div className="breadcrumb">
        <Link to="/">الرئيسية</Link>
        <span>/</span>
        <span>{eyebrow || title}</span>
      </div>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  )
}

export function LocalNotice() {
  const { user } = useAuth()
  const { syncState, retrySync } = useLearning()
  return (
    <div className="local-notice">
      <span className="notice-icon">
        <Check size={16} />
      </span>
      <span>
        {user
          ? syncState === 'error'
            ? 'تعذّر مزامنة تقدمك. تحقق من الاتصال وأعد المحاولة.'
            : syncState === 'saving'
              ? 'جارٍ حفظ تقدمك في حسابك…'
              : syncState === 'loading'
                ? 'جارٍ تحميل تقدمك من حسابك…'
                : 'تقدمك مرتبط بحسابك ويُحفظ بين أجهزتك.'
          : 'تُحفظ محاولتك على هذا الجهاز. سجّل الدخول لحفظ تقدمك في حسابك.'}
      </span>
      {user && syncState === 'error' && (
        <button className="text-link" onClick={retrySync}>
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}

export function BottomCTA() {
  return (
    <section className="container">
      <div className="bottom-cta">
        <div>
          <span className="eyebrow">استعداد يستحق البداية</span>
          <h2>
            خطوة صغيرة اليوم.
            <br />
            وفهم أوضح للغد.
          </h2>
        </div>
        <div className="bottom-cta-action">
          <p>ابدأ بتدريب قصير، واكتشف ما تحتاج إلى تطويره.</p>
          <Link className="button" to="/practice">
            ابدأ التدريب الآن <ArrowLeft size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('tafaseel-theme')
      return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#162a31' : '#f8faf9')
    try {
      localStorage.setItem('tafaseel-theme', dark ? 'dark' : 'light')
    } catch {
      /* Appearance still works without storage. */
    }
  }, [dark])

  return (
    <button
      className="icon-button theme-toggle"
      aria-label={dark ? 'تفعيل المظهر الفاتح' : 'تفعيل المظهر الداكن'}
      onClick={() => setDark((v) => !v)}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
