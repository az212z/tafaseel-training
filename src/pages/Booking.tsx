import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Phone, WhatsappLogo } from '@phosphor-icons/react'
import { courseGroups } from '../data/course-catalog'
import { useCatalog } from '../services/catalog'
import { bookingWhatsAppUrl, contact, normalizeBookingPhone } from '../services/contact'

type Field = 'name' | 'phone' | 'course' | 'email' | 'city' | 'notes'

export default function Booking() {
  const { courses, loading, error } = useCatalog()
  const [params, setParams] = useSearchParams()
  const requestedCourse = params.get('course') || ''
  const course = courses.find((item) => item.id === requestedCourse)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [preparedUrl, setPreparedUrl] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const read = (field: Field) => String(form.get(field) || '').trim()
    const name = read('name').replace(/\s+/g, ' ')
    const phone = normalizeBookingPhone(read('phone'))
    const email = read('email'),
      city = read('city'),
      notes = read('notes')
    const issues: Partial<Record<Field, string>> = {}
    if (name.length < 2 || name.length > 80) issues.name = 'أدخل اسمك من حرفين إلى ٨٠ حرفًا.'
    if (!phone) issues.phone = 'أدخل رقم جوال سعودي صحيحًا يبدأ بـ 05 أو +9665.'
    if (!course) issues.course = 'اختر الدورة التي ترغب في حجزها.'
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254))
      issues.email = 'أدخل بريدًا إلكترونيًا صحيحًا، أو اترك الحقل فارغًا.'
    if (city.length > 80) issues.city = 'اكتب اسم المدينة في ٨٠ حرفًا أو أقل.'
    if (notes.length > 600) issues.notes = 'اكتب ملاحظاتك في ٦٠٠ حرف أو أقل.'
    setErrors(issues)
    setPreparedUrl('')
    if (Object.keys(issues).length) {
      const first = Object.keys(issues)[0]
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    const url = bookingWhatsAppUrl({ name, phone, course: course!.title, email, city, notes })
    setPreparedUrl(url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const fieldError = (field: Field) =>
    errors[field] ? (
      <span className="booking-field-error" id={`${field}-error`}>
        {errors[field]}
      </span>
    ) : null
  const accessibility = (field: Field) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  })

  return (
    <div className="container booking-page">
      <nav className="breadcrumbs" aria-label="مسار التصفح">
        <Link to="/">الرئيسية</Link>
        <span>/</span>
        <Link to="/programs">الدورات التدريبية</Link>
        <span>/</span>
        <span>حجز دورة</span>
      </nav>
      <header className="booking-intro">
        <span className="eyebrow">الحجز في مركز تفاصيل</span>
        <h1>احجز دورتك.</h1>
        <p>
          أكمل بياناتك واختر الدورة. نجهّز لك رسالة واتساب لمراجعة التفاصيل وتأكيد الحجز مع المركز.
        </p>
      </header>
      <div className="booking-form-layout">
        <section className="booking-form-panel" aria-labelledby="booking-form-title">
          <div className="booking-form-heading">
            <h2 id="booking-form-title">بيانات الحجز</h2>
            <span>الحقول بعلامة * مطلوبة</span>
          </div>
          {error && (
            <div className="booking-alert" role="alert">
              <p>تعذّر تحميل الدورات. أعد المحاولة لإكمال الحجز.</p>
              <button className="text-link" onClick={() => location.reload()}>
                إعادة المحاولة
              </button>
            </div>
          )}
          {!loading && !error && !courses.length && (
            <p className="booking-alert" role="status">
              لا توجد دورات متاحة للحجز حاليًا. تواصل مع المركز للاستفسار عن البرامج القادمة.
            </p>
          )}
          {!loading && !error && requestedCourse && !course && (
            <p className="booking-alert" role="status">
              الدورة المطلوبة غير متاحة حاليًا. اختر دورة أخرى من القائمة.
            </p>
          )}
          <form
            ref={formRef}
            noValidate
            onSubmit={submit}
            onChange={() => {
              setPreparedUrl('')
              setErrors({})
            }}
          >
            <div className="booking-form-fields">
              <label htmlFor="booking-name">
                الاسم الكامل <span aria-hidden="true">*</span>
                <input
                  id="booking-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  placeholder="اسم المتدرب"
                  {...accessibility('name')}
                />
                {fieldError('name')}
              </label>
              <label htmlFor="booking-phone">
                رقم الجوال <span aria-hidden="true">*</span>
                <input
                  id="booking-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  required
                  maxLength={24}
                  placeholder="05xxxxxxxx"
                  {...accessibility('phone')}
                />
                {fieldError('phone')}
              </label>
              <label className="booking-field-wide" htmlFor="booking-course">
                الدورة التدريبية <span aria-hidden="true">*</span>
                <select
                  id="booking-course"
                  name="course"
                  required
                  value={course?.id || ''}
                  disabled={loading || !!error}
                  onChange={(event) =>
                    setParams(event.target.value ? { course: event.target.value } : {}, {
                      replace: true,
                    })
                  }
                  {...accessibility('course')}
                >
                  <option value="">
                    {loading ? 'جارٍ تحميل الدورات…' : 'اختر الدورة المناسبة لك'}
                  </option>
                  {courseGroups.map((group) => (
                    <optgroup label={group.title} key={group.id}>
                      {courses
                        .filter((item) => item.groupId === group.id)
                        .map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {fieldError('course')}
              </label>
              <label htmlFor="booking-email">
                البريد الإلكتروني <small>اختياري</small>
                <input
                  id="booking-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="name@example.com"
                  {...accessibility('email')}
                />
                {fieldError('email')}
              </label>
              <label htmlFor="booking-city">
                المدينة <small>اختياري</small>
                <input
                  id="booking-city"
                  name="city"
                  autoComplete="address-level2"
                  maxLength={80}
                  placeholder="مدينتك"
                  {...accessibility('city')}
                />
                {fieldError('city')}
              </label>
              <label className="booking-field-wide" htmlFor="booking-notes">
                ملاحظات أو استفسارات <small>اختياري</small>
                <textarea
                  id="booking-notes"
                  name="notes"
                  rows={4}
                  maxLength={600}
                  placeholder="هدفك من الدورة، أو استفسار ترغب في مناقشته مع المركز…"
                  {...accessibility('notes')}
                />
                {fieldError('notes')}
              </label>
            </div>
            <p className="booking-data-note">
              تُستخدم بياناتك لتجهيز رسالة الحجز. راجعها ثم أرسلها من واتساب إلى المركز.{' '}
              <Link to="/privacy">الخصوصية</Link>
            </p>
            <button
              className="button booking-submit"
              type="submit"
              disabled={loading || !!error || !courses.length}
            >
              متابعة الحجز عبر واتساب <WhatsappLogo size={24} />
            </button>
            {preparedUrl && (
              <div className="booking-prepared" role="status">
                <CheckCircle size={24} />
                <div>
                  <strong>رسالة الحجز جاهزة للإرسال.</strong>
                  <p>
                    أرسلها من واتساب، ثم انتظر رد المركز لتأكيد الموعد والرسوم. إذا لم تفتح
                    المحادثة، استخدم الرابط التالي.
                  </p>
                  <a
                    className="text-link"
                    href={preparedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    فتح رسالة الحجز <ArrowLeft size={18} />
                  </a>
                </div>
              </div>
            )}
          </form>
        </section>
        <aside className="booking-summary" aria-label="تفاصيل طلب الحجز">
          {course && (
            <figure className="booking-selected-course">
              <img src={course.image} alt={course.imageAlt} width={1200} height={800} />
              <figcaption>
                <span className="eyebrow">الدورة المختارة</span>
                <h2>{course.title}</h2>
                <p>{course.short}</p>
                <Link className="text-link" to={`/programs/${course.id}`}>
                  تفاصيل الدورة <ArrowLeft size={18} />
                </Link>
              </figcaption>
            </figure>
          )}
          <div className="booking-next">
            <span className="eyebrow">من الطلب إلى التأكيد</span>
            <h2>نرتّب معك التفاصيل.</h2>
            <ol>
              <li>
                <span>١</span>
                <div>
                  <h3>أكمل النموذج</h3>
                  <p>حدد دورتك وأضف بيانات التواصل.</p>
                </div>
              </li>
              <li>
                <span>٢</span>
                <div>
                  <h3>أرسل عبر واتساب</h3>
                  <p>تفتح رسالة جاهزة ببيانات طلبك لتراجعها وترسلها.</p>
                </div>
              </li>
              <li>
                <span>٣</span>
                <div>
                  <h3>استلم تأكيد المركز</h3>
                  <p>نوضح المواعيد والرسوم والمتطلبات، ثم نؤكد حجزك في المحادثة.</p>
                </div>
              </li>
            </ol>
            <a className="booking-phone" href={`tel:${contact.phone}`}>
              <Phone size={20} />
              <bdi>{contact.displayPhone}</bdi>
            </a>
            <p className="booking-confirmation-note">إرسال الطلب لا يُعد تأكيدًا نهائيًا للحجز.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
