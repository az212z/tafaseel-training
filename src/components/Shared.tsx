import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
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
  WhatsappLogo,
  InstagramLogo,
  SnapchatLogo,
  Phone,
  Translate,
  Palette,
  Briefcase,
} from '@phosphor-icons/react'
import { faqs } from '../data/content'
import { courseGroups } from '../data/course-catalog'
import { contact, whatsappUrl } from '../services/contact'
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
    ['/programs', 'الدورات التدريبية'],
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

export function WhatsAppLink({
  courseTitle,
  children,
  className = 'button',
}: {
  courseTitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      className={className}
      href={whatsappUrl(courseTitle)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <WhatsappLogo size={22} />
    </a>
  )
}
export function SocialLinks() {
  return (
    <div className="social-links" aria-label="حسابات التواصل الاجتماعي">
      {contact.instagram ? (
        <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="إنستقرام">
          <InstagramLogo size={22} />
        </a>
      ) : (
        <button
          disabled
          title="يُضاف حساب إنستقرام قريبًا"
          aria-label="إنستقرام — يُضاف الحساب قريبًا"
        >
          <InstagramLogo size={22} />
          <span>
            إنستقرام <small>قريبًا</small>
          </span>
        </button>
      )}
      {contact.snapchat ? (
        <a href={contact.snapchat} target="_blank" rel="noopener noreferrer" aria-label="سناب شات">
          <SnapchatLogo size={22} />
        </a>
      ) : (
        <button
          disabled
          title="يُضاف حساب سناب شات قريبًا"
          aria-label="سناب شات — يُضاف الحساب قريبًا"
        >
          <SnapchatLogo size={22} />
          <span>
            سناب شات <small>قريبًا</small>
          </span>
        </button>
      )}
    </div>
  )
}
export function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="الحجز والاستفسار عبر واتساب"
    >
      <WhatsappLogo size={28} />
      <span>احجز دورتك</span>
    </a>
  )
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Brand />
          <p>
            معرفة تتسع.
            <br />
            ومهارات تتطور.
          </p>
          <SocialLinks />
        </div>
        <div>
          <h3>مجالات التدريب</h3>
          {courseGroups.map((g) => (
            <Link to={`/programs/category/${g.id}`} key={g.id}>
              {g.title}
            </Link>
          ))}
        </div>
        <div>
          <h3>مركز تفاصيل</h3>
          <Link to="/about">عن المركز</Link>
          <Link to="/library">مكتبة التعلّم</Link>
          <Link to="/dashboard">حساب المتدرب</Link>
          <Link to="/contact">تواصل معنا</Link>
        </div>
        <div className="footer-message">
          <span className="eyebrow">الحجز والاستفسار</span>
          <h3>نرتّب خطوتك القادمة.</h3>
          <WhatsAppLink className="text-link">تواصل عبر واتساب</WhatsAppLink>
          <a className="footer-phone" href={`tel:${contact.phone}`}>
            <Phone size={19} />
            <bdi>{contact.displayPhone}</bdi>
          </a>
          <p>الحجز والتأكيد عبر واتساب المركز.</p>
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
  if (symbol === 'exams') return <GraduationCap size={size} weight="duotone" />
  if (symbol === 'english') return <Translate size={size} weight="duotone" />
  if (symbol === 'arts') return <Palette size={size} weight="duotone" />
  if (symbol === 'development') return <Briefcase size={size} weight="duotone" />
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
    <article className={`course-card photo-course ${course.tone}`}>
      <Link
        className="course-cover-link"
        to={`/programs/${course.id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img src={course.image} alt="" width="1200" height="800" loading="lazy" decoding="async" />
      </Link>
      <div className="course-body">
        <div className="course-meta">
          <span>{course.category}</span>
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
            تفاصيل الدورة <ArrowLeft size={18} />
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
          <span className="eyebrow">بداية مدروسة</span>
          <h2>
            اختر هدفك.
            <br />
            ودعنا نرتّب التفاصيل.
          </h2>
          <p>تعرّف على الدورة المناسبة ومواعيدها ورسومها قبل تأكيد الحجز.</p>
        </div>
        <WhatsAppLink>تواصل للحجز</WhatsAppLink>
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
