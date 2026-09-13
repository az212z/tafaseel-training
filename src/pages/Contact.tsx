import { Link } from 'react-router-dom'
import { ArrowLeft, Phone, ChatCircleText, CheckCircle } from '@phosphor-icons/react'
import { FAQ, PageHeading, SocialLinks, WhatsAppLink } from '../components/Shared'
import { contact } from '../services/contact'
export default function Contact() {
  return (
    <>
      <PageHeading
        eyebrow="تواصل معنا"
        title="كل بداية، تبدأ بمحادثة."
        description="للحجز والاستفسار عن الدورات، تواصل مع مركز تفاصيل مباشرة. نوضح لك الخيارات ونعتمد معك تفاصيل الحجز عبر واتساب."
      />
      <div className="container page-content">
        <div className="contact-booking-layout">
          <section className="contact-booking-main">
            <span className="portal-icon">
              <ChatCircleText size={31} />
            </span>
            <span className="eyebrow">الحجز وتأكيد الحجز</span>
            <h2>واتساب تفاصيل.</h2>
            <p>
              أرسل اسم الدورة التي تهتم بها. يوضح لك المركز المواعيد والرسوم ونمط التدريب
              والمتطلبات، ثم يؤكد حجزك في المحادثة.
            </p>
            <WhatsAppLink>ابدأ المحادثة</WhatsAppLink>
            <div className="contact-confirm-note">
              <CheckCircle size={21} />
              <p>يُعد الحجز مؤكدًا بعد استلام تأكيد المركز عبر واتساب.</p>
            </div>
          </section>
          <aside className="contact-channels">
            <div>
              <Phone size={28} />
              <h2>اتصل بالمركز</h2>
              <a href={`tel:${contact.phone}`} className="contact-number">
                <bdi>{contact.displayPhone}</bdi>
              </a>
              <p>الرقم نفسه للاتصال وواتساب.</p>
            </div>
            <div>
              <h2>تابع تفاصيل</h2>
              <p>حساباتنا الاجتماعية تُضاف قريبًا.</p>
              <SocialLinks />
            </div>
            <div>
              <h2>للمتدربين المسجلين</h2>
              <p>تابع محتواك ودفعاتك أو أرسل استفسارًا يخص حسابك.</p>
              <Link className="text-link" to="/dashboard/support">
                مراسلات حسابي <ArrowLeft size={18} />
              </Link>
            </div>
          </aside>
        </div>
        <section className="section faq-section">
          <div>
            <span className="eyebrow">قبل التواصل</span>
            <h2>تفاصيل تساعدك.</h2>
            <p>اختيار الدورة والحجز والمتابعة.</p>
          </div>
          <FAQ />
        </section>
      </div>
    </>
  )
}
