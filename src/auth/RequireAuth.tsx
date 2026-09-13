import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context'
export default function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode
  admin?: boolean
}) {
  const auth = useAuth(),
    location = useLocation()
  if (auth.loading)
    return (
      <div className="portal-loading" role="status">
        جارٍ فتح حسابك…
      </div>
    )
  if (!auth.user)
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (auth.error)
    return (
      <div className="container error-page">
        <h1>تعذّر تحميل حسابك</h1>
        <p role="alert">{auth.error}</p>
        <button className="button" onClick={() => void auth.refresh()}>
          إعادة المحاولة
        </button>
      </div>
    )
  if (auth.profile?.status === 'suspended')
    return (
      <div className="container error-page">
        <h1>حسابك موقوف مؤقتًا</h1>
        <p>راجع إدارة المركز لاستعادة الوصول إلى حسابك.</p>
        <button className="button" onClick={() => void auth.signOut()}>
          تسجيل الخروج
        </button>
      </div>
    )
  if (auth.profile?.must_change_password) return <Navigate to="/account/security" replace />
  if (admin && !auth.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
