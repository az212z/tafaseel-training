import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle, X } from '@phosphor-icons/react'
import { Header, Footer, FloatingWhatsApp } from './components/Shared'
import LearningProvider from './services/LearningProvider'
import AuthProvider from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import { useAuth } from './auth/context'
import Home from './pages/Home'

const Programs = lazy(() => import('./pages/Programs'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Practice = lazy(() => import('./pages/Practice'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Auth = lazy(() => import('./pages/Auth'))
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'))
const Learn = lazy(() => import('./pages/Learn'))
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
        <p>أعد تحميل الموقع للمحاولة مرة أخرى. يبقى تقدمك المحفوظ متاحًا في حسابك.</p>
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
      '/': 'معرفة تتسع ومهارات تتطور',
      '/programs': 'البرامج التدريبية',
      '/practice': 'التدريب التفاعلي',
      '/dashboard': 'حساب المتدرب',
      '/login': 'تسجيل الدخول',
      '/register': 'إنشاء حساب',
      '/admin': 'لوحة الإدارة',
      '/library': 'مكتبة التعلّم',
      '/about': 'عن المركز',
      '/contact': 'تواصل معنا',
      '/privacy': 'الخصوصية واستخدام الموقع',
    }
    document.title = `${names[pathname] || (pathname.startsWith('/admin/') ? 'لوحة الإدارة' : pathname.startsWith('/dashboard/') ? 'حساب المتدرب' : pathname.startsWith('/learn/') ? 'الدرس التدريبي' : pathname.startsWith('/programs/') ? 'تفاصيل المسار' : 'تفاصيل')} | مركز تفاصيل للتدريب`
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
function AppContent() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const portalRoute = /^\/(dashboard|admin|learn)(\/|$)/.test(pathname)
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
  return (
    <ErrorBoundary>
      <LearningProvider key={user?.id || 'guest'} notify={notify} onStorageError={setStorageError}>
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
        {!portalRoute && <Header />}
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
              <Route path="/programs/category/:groupId" element={<Programs />} />
              <Route path="/programs/:id" element={<CourseDetail />} />
              <Route path="/practice" element={<Practice />} />
              <Route
                path="/dashboard/*"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <RequireAuth admin>
                    <Admin />
                  </RequireAuth>
                }
              />
              <Route
                path="/learn/:courseId/:lessonId?"
                element={
                  <RequireAuth>
                    <Learn />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/forgot-password" element={<Auth />} />
              <Route path="/auth/reset" element={<Auth />} />
              <Route path="/account/security" element={<AccountSecurity />} />
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
        {!portalRoute && (
          <>
            <Footer />
            <FloatingWhatsApp />
          </>
        )}
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
      </LearningProvider>
    </ErrorBoundary>
  )
}
