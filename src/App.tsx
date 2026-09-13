import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle, X } from '@phosphor-icons/react'
import { Header, Footer } from './components/Shared'
import { LearningContext } from './services/context'
import { readLearning, writeLearning } from './services/learning'
import type { LearningState } from './services/learning'
import Home from './pages/Home'

const Programs = lazy(() => import('./pages/Programs'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Practice = lazy(() => import('./pages/Practice'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? (
      <div className="error-page container">
        <h1>تعذّر عرض الصفحة</h1>
        <p>أعد تحميل الموقع للمحاولة مرة أخرى. بياناتك المحفوظة تبقى على جهازك.</p>
        <button className="button" onClick={() => window.location.reload()}>
          إعادة التحميل
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}

function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    const names: Record<string, string> = {
      '/': 'استعدادك يبدأ بفهمك',
      '/programs': 'البرامج التدريبية',
      '/practice': 'التدريب التفاعلي',
      '/dashboard': 'مساحة المتدرب',
      '/library': 'مكتبة التعلّم',
      '/about': 'عن المركز',
      '/contact': 'تواصل معنا',
      '/privacy': 'الخصوصية واستخدام الموقع',
    }
    document.title = `${names[pathname] || (pathname.startsWith('/programs/') ? 'تفاصيل المسار' : 'مكتبة التعلّم')} | مركز تفاصيل للتدريب`
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

export default function App() {
  const [state, setState] = useState(readLearning)
  const stateRef = useRef(state)
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const notify = (message: string) => {
    setToast(message)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(''), 4500)
  }
  const update = (fn: (s: LearningState) => LearningState) => {
    const next = fn(stateRef.current)
    stateRef.current = next
    setState(next)
    setStorageError(!writeLearning(next))
  }
  return (
    <ErrorBoundary>
      <LearningContext.Provider value={{ state, update, notify }}>
        <a
          href="#main-content"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main-content')?.focus()
          }}
        >
          تجاوز إلى المحتوى
        </a>
        <Header />
        <RouteEffects />
        {storageError && (
          <div className="storage-warning" role="alert">
            التخزين غير متاح في هذا المتصفح. يمكنك المتابعة، لكن تقدمك لن يبقى بعد إغلاق الصفحة.
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          <Suspense
            fallback={
              <div
                className="container page-skeleton"
                aria-label="جارٍ تحميل الصفحة"
                aria-busy="true"
              >
                <div />
                <div />
                <div />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<CourseDetail />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:id" element={<Library />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route
                path="*"
                element={
                  <div className="container error-page">
                    <span className="eyebrow">٤٠٤</span>
                    <h1>هذه الصفحة غير موجودة</h1>
                    <p>يمكنك العودة للرئيسية واختيار وجهتك من القائمة.</p>
                    <Link to="/" className="button">
                      العودة للرئيسية <ArrowLeft />
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
          {toast && (
            <>
              <CheckCircle size={22} weight="fill" />
              <span>{toast}</span>
              <button
                className="icon-button"
                aria-label="إغلاق التنبيه"
                onClick={() => setToast('')}
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      </LearningContext.Provider>
    </ErrorBoundary>
  )
}
