import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LockKey } from '@phosphor-icons/react'
import { useAuth } from '../auth/context'
import { accountAction, supabase } from '../services/backend'
import { MutationForm } from '../components/portal/PortalUI'
export default function AccountSecurity() {
  const auth = useAuth(),
    navigate = useNavigate()
  if (auth.loading) return <div className="portal-loading">جارٍ تحميل حسابك…</div>
  if (!auth.user) return <Navigate to="/admin/login" replace />
  return (
    <section className="container password-change-page">
      <span className="portal-icon">
        <LockKey size={32} />
      </span>
      <h1>اجعل كلمة المرور خاصة بك.</h1>
      <p>قبل الدخول إلى حسابك، استبدل كلمة المرور التي زوّدتك بها الإدارة.</p>
      <MutationForm
        submit="حفظ كلمة المرور والدخول"
        onSubmit={async (f) => {
          if (f.get('password') !== f.get('confirm_password')) throw Error('weak_password')
          await accountAction({
            action: 'change_password',
            current_password: f.get('current_password'),
            password: f.get('password'),
          })
          const login = await supabase.auth.signInWithPassword({
            email: auth.user!.email!,
            password: String(f.get('password')),
          })
          if (login.error) throw login.error
          await auth.refresh()
          const role = await supabase.rpc('is_admin')
          navigate(role.data === true ? '/admin' : '/dashboard', { replace: true })
        }}
      >
        <label>
          كلمة المرور الحالية
          <input
            type="password"
            name="current_password"
            required
            autoComplete="current-password"
            dir="ltr"
          />
        </label>
        <label>
          كلمة المرور الجديدة
          <input
            type="password"
            name="password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            dir="ltr"
          />
        </label>
        <p className="field-hint">10 أحرف على الأقل، تشمل حرفًا إنجليزيًا كبيرًا وصغيرًا ورقمًا.</p>
        <label>
          تأكيد كلمة المرور الجديدة
          <input
            type="password"
            name="confirm_password"
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            dir="ltr"
          />
        </label>
      </MutationForm>
      <button className="text-link" onClick={() => void auth.signOut()}>
        تسجيل الخروج
      </button>
      <Link to="/privacy" className="text-link">
        الخصوصية
      </Link>
    </section>
  )
}
