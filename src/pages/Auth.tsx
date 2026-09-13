import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useAuth } from '../auth/context'
import {
  authEmailEnabled,
  backendReady,
  errorMessage,
  profileSchema,
  supabase,
} from '../services/backend'
export default function Auth() {
  const { pathname } = useLocation(),
    navigate = useNavigate(),
    [params] = useSearchParams(),
    auth = useAuth()
  const register = pathname === '/register',
    forgot = pathname === '/forgot-password',
    reset = pathname === '/auth/reset'
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [show, setShow] = useState(false)
  const next = params.get('next')
  const destination =
    next?.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/login') &&
    !next.startsWith('/register')
      ? next
      : auth.isAdmin
        ? '/admin'
        : '/dashboard'
  if (!reset && auth.user && !auth.loading && auth.profile)
    return <Navigate to={destination} replace />
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!backendReady) {
      setError('خدمة الحسابات غير متاحة الآن.')
      return
    }
    setBusy(true)
    const form = new FormData(e.currentTarget),
      email = String(form.get('email') || '').trim(),
      password = String(form.get('password') || '')
    try {
      if (register) {
        const parsed = profileSchema.safeParse({
          full_name: form.get('full_name'),
          phone: form.get('phone'),
          city: form.get('city') || '',
          education_level: form.get('education_level') || '',
        })
        if (!parsed.success) {
          setError(parsed.error.issues[0].message)
          return
        }
        if (password !== form.get('confirm_password')) {
          setError('كلمتا المرور غير متطابقتين.')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: parsed.data,
            emailRedirectTo: `${location.origin}${location.pathname}#/dashboard`,
          },
        })
        if (error) throw error
        if (data.session) {
          await auth.refresh()
          navigate(destination, { replace: true })
        } else setSuccess('أرسلنا رابط تفعيل إلى بريدك. افتح الرسالة لإكمال التسجيل.')
      } else if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}${location.pathname}#/auth/reset`,
        })
        if (error) throw error
        setSuccess('إذا كان البريد مسجلًا، ستصلك رسالة لاستعادة كلمة المرور.')
      } else if (reset) {
        if (password !== form.get('confirm_password')) {
          setError('كلمتا المرور غير متطابقتين.')
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setSuccess('تم تحديث كلمة المرور. يمكنك الآن العودة إلى حسابك.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await auth.refresh()
        const { data: administrator } = await supabase.rpc('is_admin')
        navigate(
          next?.startsWith('/') &&
            !next.startsWith('//') &&
            !next.startsWith('/login') &&
            !next.startsWith('/register')
            ? next
            : administrator
              ? '/admin'
              : '/dashboard',
          { replace: true },
        )
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const title = register
    ? 'خطوتك الأولى، تبدأ هنا.'
    : forgot
      ? 'استعادة كلمة المرور'
      : reset
        ? 'كلمة مرور جديدة'
        : 'أهلًا بعودتك.'
  return (
    <section className="auth-layout container">
      <div className="auth-story">
        <div className="auth-story-pattern" />
        <span className="eyebrow">تفاصيل رحلتك</span>
        <h1>
          حساب واحد.
          <br />
          كل ما تحتاجه
          <br />
          <em>لتتقدّم.</em>
        </h1>
        <p>
          كورساتك، دروسك، ومتابعة إنجازك.
          <br />
          في مساحة تخصك وترافقك أينما تعلّمت.
        </p>
        <div className="auth-promises">
          <span>
            <CheckCircle /> محتواك التدريبي في مكان واحد
          </span>
          <span>
            <CheckCircle /> متابعة التقدم والدفعات
          </span>
          <span>
            <ShieldCheck /> وصول خاص إلى بياناتك
          </span>
        </div>
        <span className="auth-story-signature">في التفاصيل، فرق.</span>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="text-link">
          <ArrowRight size={18} /> العودة إلى الموقع
        </Link>
        <div className="auth-title">
          <span className="portal-icon">
            <LockKey size={28} />
          </span>
          <h2>{title}</h2>
          <p>
            {register
              ? 'أنشئ حسابك، ثم اختر الكورس المناسب لك.'
              : forgot
                ? 'سنساعدك على العودة إلى حسابك.'
                : reset
                  ? 'اختر كلمة مرور قوية لا تستخدمها في مواقع أخرى.'
                  : 'أدخل بياناتك، وأكمل من حيث توقفت.'}
          </p>
        </div>
        {forgot && !authEmailEnabled ? (
          <div className="form-notice">
            <h3>الاستعادة عبر الإدارة</h3>
            <p>
              الاستعادة التلقائية بالبريد لم تُفعّل بعد. تواصل مع إدارة المركز للتحقق من هويتك
              وإعادة تعيين كلمة المرور.
            </p>
            <Link className="button button-outline" to="/login">
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : reset && !auth.user ? (
          <div className="form-notice">
            <p>افتح رابط الاستعادة الذي وصلك بالبريد أولًا.</p>
            <Link to="/forgot-password" className="text-link">
              طلب استعادة كلمة المرور
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="portal-form">
            {register && (
              <>
                <label>
                  الاسم الكامل
                  <input
                    name="full_name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="اسمك كما يظهر في سجلات المركز"
                  />
                </label>
                <label>
                  رقم الجوال
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    dir="ltr"
                    required
                    maxLength={20}
                    placeholder="05XXXXXXXX"
                  />
                </label>
              </>
            )}
            {!reset && (
              <label>
                البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  dir="ltr"
                  placeholder="name@example.com"
                />
              </label>
            )}
            {!forgot && (
              <>
                <label>
                  كلمة المرور
                  <span className="password-field">
                    <input
                      name="password"
                      type={show ? 'text' : 'password'}
                      autoComplete={register || reset ? 'new-password' : 'current-password'}
                      required
                      minLength={register || reset ? 10 : 1}
                      maxLength={128}
                      dir="ltr"
                      aria-describedby={register || reset ? 'password-hint' : undefined}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      onClick={() => setShow((v) => !v)}
                    >
                      {show ? <EyeSlash size={20} /> : <Eye size={20} />}
                    </button>
                  </span>
                </label>
                {(register || reset) && (
                  <>
                    <p className="field-hint" id="password-hint">
                      10 أحرف على الأقل، تشمل حرفًا إنجليزيًا كبيرًا وصغيرًا ورقمًا.
                    </p>
                    <label>
                      تأكيد كلمة المرور
                      <input
                        name="confirm_password"
                        type={show ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={10}
                        maxLength={128}
                        dir="ltr"
                      />
                    </label>
                  </>
                )}
              </>
            )}
            {register && (
              <>
                <div className="form-two-col">
                  <label>
                    المدينة <span className="optional">اختياري</span>
                    <input name="city" autoComplete="address-level2" maxLength={100} />
                  </label>
                  <label>
                    المرحلة الدراسية <span className="optional">اختياري</span>
                    <select name="education_level">
                      <option value="">اختر المرحلة</option>
                      <option>المرحلة الثانوية</option>
                      <option>خريج الثانوية</option>
                      <option>المرحلة الجامعية</option>
                      <option>أخرى</option>
                    </select>
                  </label>
                </div>
                <label className="consent-field">
                  <input type="checkbox" required />
                  <span>
                    اطلعت على{' '}
                    <Link to="/privacy" target="_blank">
                      سياسة الخصوصية
                    </Link>{' '}
                    وأوافق على إنشاء حسابي.
                  </span>
                </label>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <div className="form-success" role="status">
                {success}
                {reset && (
                  <Link to="/dashboard" className="text-link">
                    الذهاب إلى حسابي <ArrowLeft size={18} />
                  </Link>
                )}
              </div>
            )}
            <button className="button full-width" disabled={busy || !backendReady}>
              {busy
                ? 'جارٍ التنفيذ…'
                : register
                  ? 'إنشاء حساب'
                  : forgot
                    ? 'إرسال رابط الاستعادة'
                    : reset
                      ? 'حفظ كلمة المرور'
                      : 'تسجيل الدخول'}
              <ArrowLeft size={19} />
            </button>
            {!register && !forgot && !reset && (
              <Link to="/forgot-password" className="auth-forgot">
                نسيت كلمة المرور؟
              </Link>
            )}
          </form>
        )}
        {!forgot && !reset && (
          <p className="auth-switch">
            {register ? 'لديك حساب؟' : 'هذه زيارتك الأولى؟'}{' '}
            <Link
              to={`${register ? '/login' : '/register'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            >
              {register ? 'تسجيل الدخول' : 'أنشئ حسابك'}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
