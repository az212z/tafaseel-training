import { Link } from 'react-router-dom'
import { ArrowLeft, ChatCircleText, GraduationCap, UserCircle } from '@phosphor-icons/react'
import { FAQ, PageHeading } from '../components/Shared'
import { useAuth } from '../auth/context'
export default function Contact() {
  const { user } = useAuth()
  return (
    <>
      <PageHeading
        eyebrow="تواصل معنا"
        title="لكل سؤال، تفاصيل أوضح."
        description="استفسر عن مسارك، وتابع طلبك مع إدارة المركز من حسابك."
      />
      <div className="container page-content">
        <div className="contact-account-grid">
          <div className="contact-account-main">
            <span className="portal-icon">
              <ChatCircleText size={30} />
            </span>
            <h2>تواصل يبقى معك.</h2>
            <p>
              أرسل رسالتك من حسابك لتبقى مرتبطة ببياناتك وكورساتك، وتابع رد الإدارة في المكان نفسه.
            </p>
            <Link
              className="button"
              to={user ? '/dashboard/support' : '/login?next=%2Fdashboard%2Fsupport'}
            >
              {user ? 'فتح المراسلات' : 'تسجيل الدخول والتواصل'}
              <ArrowLeft size={19} />
            </Link>
            {!user && (
              <Link className="text-link" to="/register?next=%2Fdashboard%2Fsupport">
                ليس لديك حساب؟ أنشئ حسابك
              </Link>
            )}
          </div>
          <div className="contact-account-help">
            <article>
              <GraduationCap size={27} />
              <div>
                <h3>الاستفسار عن الكورسات</h3>
                <p>
                  استعرض البرامج، ثم أرسل طلب الالتحاق من حسابك. تعتمد الإدارة الدفعة والرسوم قبل
                  بدء التدريب.
                </p>
                <Link className="text-link" to="/programs">
                  استعرض البرامج <ArrowLeft size={17} />
                </Link>
              </div>
            </article>
            <article>
              <UserCircle size={27} />
              <div>
                <h3>المساعدة في الحساب</h3>
                <p>
                  يمكنك تعديل بياناتك وكلمة مرورك من إعدادات الحساب. عند تعذّر الدخول، راجع إدارة
                  المركز للتحقق من هويتك واستعادة الوصول.
                </p>
                <Link className="text-link" to="/forgot-password">
                  مساعدة في تسجيل الدخول <ArrowLeft size={17} />
                </Link>
              </div>
            </article>
          </div>
        </div>
        <section className="section">
          <div className="section-heading">
            <div>
              <h2>إجابات تساعدك على البدء.</h2>
              <p>معلومات مختصرة عن التدريب والتسجيل.</p>
            </div>
          </div>
          <FAQ />
        </section>
      </div>
    </>
  )
}
