import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  DownloadSimple,
  FloppyDisk,
  Info,
  PencilLine,
} from '@phosphor-icons/react'
import { PageHeading } from '../components/Shared'
import { courses } from '../data/content'
import { useLearning } from '../services/context'
import { downloadText } from '../services/learning'

export default function Contact() {
  const { state, update } = useLearning()
  const [params] = useSearchParams()
  const [form, setForm] = useState(() => ({
    name: state.draft?.name || '',
    phone: state.draft?.phone || '',
    program: courses.some((c) => c.id === params.get('program'))
      ? params.get('program')!
      : state.draft?.program || '',
    message: state.draft?.message || '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [consent, setConsent] = useState(false)
  const change = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
    setErrors((e) => ({ ...e, [field]: '' }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const phone = form.phone
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[\s-]/g, '')
    if (form.name.trim().length < 2) next.name = 'أدخل اسمًا من حرفين على الأقل.'
    if (phone && !/^(05\d{8}|(?:\+?966|00966)5\d{8})$/.test(phone))
      next.phone = 'أدخل رقم جوال سعودي صحيحًا، مثل 05XXXXXXXX.'
    if (form.message.trim().length < 10) next.message = 'اكتب استفسارك في ١٠ أحرف على الأقل.'
    if (!consent) next.consent = 'وافق على حفظ هذه المسودة على جهازك للمتابعة.'
    setErrors(next)
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0]
      document.getElementById(first)?.focus()
      return
    }
    update((s) => ({
      ...s,
      draft: {
        ...form,
        name: form.name.trim(),
        phone,
        message: form.message.trim(),
        savedAt: new Date().toISOString(),
      },
    }))
    setSaved(true)
  }
  return (
    <>
      <PageHeading
        eyebrow="تواصل معنا"
        title="استفسارك، بكل تفاصيله."
        description="حدد المسار الذي يهمك، واكتب ما تحتاج إلى معرفته لتكون خطوتك القادمة أوضح."
      />
      <section className="container contact-layout page-content">
        <aside className="contact-aside">
          <span className="contact-symbol">
            <PencilLine size={38} weight="light" />
          </span>
          <h2>لنبدأ بسؤالك.</h2>
          <p>
            سواء كنت في بداية الاستعداد أو تبحث عن تدريب أكثر تركيزًا، اجمع استفساراتك في مكان واحد.
          </p>
          <div className="contact-status">
            <Info size={23} />
            <div>
              <h3>قنوات التواصل تُضاف قريبًا</h3>
              <p>يمكنك حفظ مسودة استفسارك وتنزيلها الآن. هذه النسخة لا ترسل الطلبات إلى المركز.</p>
            </div>
          </div>
          <Link to="/about" className="text-link">
            راجع الأسئلة الشائعة <ArrowLeft size={19} />
          </Link>
          <div className="contact-pattern" />
        </aside>
        <form className="contact-form" onSubmit={submit} noValidate>
          <h2>جهّز استفسارك</h2>
          <p>الحقول المعلّمة بـ * مطلوبة.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">الاسم *</label>
              <input
                id="name"
                autoComplete="name"
                maxLength={80}
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                placeholder="اسمك الكريم"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                required
              />
              {errors.name && (
                <span className="field-error" id="name-error">
                  {errors.name}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="phone">
                رقم الجوال <span>(اختياري)</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="05XXXXXXXX"
                maxLength={18}
                value={form.phone}
                onChange={(e) => change('phone', e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <span className="field-error" id="phone-error">
                  {errors.phone}
                </span>
              )}
            </div>
          </div>
          <div className="field">
            <label htmlFor="program">البرنامج الذي يهمك</label>
            <select
              id="program"
              value={form.program}
              onChange={(e) => change('program', e.target.value)}
            >
              <option value="">استفسار عام</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="message">كيف يمكننا مساعدتك؟ *</label>
            <textarea
              id="message"
              rows={5}
              maxLength={2000}
              placeholder="اكتب سؤالك أو المهارة التي ترغب في تطويرها..."
              value={form.message}
              onChange={(e) => change('message', e.target.value)}
              required
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <span className="field-error" id="message-error">
                {errors.message}
              </span>
            )}
          </div>
          <label className="consent">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                setErrors((v) => ({ ...v, consent: '' }))
              }}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
            />
            <span>
              أوافق على حفظ المسودة في هذا المتصفح على جهازي.{' '}
              <Link to="/privacy">تفاصيل الخصوصية</Link>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="field-error">
              {errors.consent}
            </p>
          )}
          <button className="button full-width" type="submit">
            <FloppyDisk size={21} />
            حفظ مسودة الاستفسار
          </button>
          {saved && (
            <div className="form-success" role="status">
              <CheckCircle size={27} />
              <div>
                <h3>مسودتك جاهزة.</h3>
                <p>تم الاحتفاظ بها في هذه المساحة دون إرسالها إلى المركز.</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    downloadText(
                      'استفسار-لمركز-تفاصيل.txt',
                      `استفسار لمركز تفاصيل للتدريب\nالاسم: ${form.name}\nالجوال: ${form.phone || 'غير مضاف'}\nالبرنامج: ${courses.find((c) => c.id === form.program)?.title || 'استفسار عام'}\n\n${form.message}\n\nهذه مسودة لم تُرسل إلى المركز.`,
                    )
                  }
                >
                  <DownloadSimple size={19} />
                  تنزيل نسخة من الاستفسار
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </>
  )
}
