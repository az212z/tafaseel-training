import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeSlash, LockKey } from '@phosphor-icons/react'
import { Brand } from '../components/Shared'
import { useAuth } from '../auth/context'
import { backendReady, errorMessage, supabase } from '../services/backend'

export default function AdminLogin() {
  const auth = useAuth(),
    navigate = useNavigate(),
    [params] = useSearchParams()
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [show, setShow] = useState(false)
  const next = params.get('next') || ''
  const destination =
    next === '/admin' || (next.startsWith('/admin/') && !next.startsWith('/admin/login'))
      ? next
      : '/admin'
  if (!auth.loading && auth.isAdmin && auth.profile)
    return (
      <Navigate
        to={auth.profile.must_change_password ? '/account/security' : destination}
        replace
      />
    )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!backendReady) {
      setError('خدمة الإدارة غير متاحة الآن.')
      return
    }
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      const result = await supabase.auth.signInWithPassword({
        email: String(form.get('email') || '').trim(),
        password: String(form.get('password') || ''),
      })
      if (result.error) throw result.error
      const role = await supabase.rpc('is_admin')
      if (role.error || role.data !== true) {
        await auth.signOut()
        setError('هذا الحساب غير مخوّل بالدخول إلى الإدارة.')
        return
      }
      await auth.refresh()
      navigate(destination, { replace: true })
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-signin container">
      <Brand />
      <div className="admin-signin-panel">
        <span className="portal-icon">
          <LockKey size={28} />
        </span>
        <span className="eyebrow">مركز تفاصيل للتدريب</span>
        <h1>دخول الإدارة</h1>
        <p>إدارة الدورات والتسجيلات وشؤون المركز.</p>
        <form className="portal-form" onSubmit={submit}>
          <label htmlFor="admin-email">
            البريد الإلكتروني
            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="username"
              required
              dir="ltr"
              maxLength={254}
            />
          </label>
          <div className="admin-password-control">
            <label htmlFor="admin-password">كلمة المرور</label>
            <div className="password-field">
              <input
                id="admin-password"
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                required
                dir="ltr"
                maxLength={128}
              />
              <button
                className="icon-button"
                type="button"
                aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
          </button>
        </form>
        <Link className="text-link" to="/">
          <ArrowRight size={18} />
          العودة إلى الموقع
        </Link>
      </div>
    </section>
  )
}
