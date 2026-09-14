import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { contact } from './contact'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const backendReady = Boolean(url && key)
export const authEmailEnabled = import.meta.env.VITE_AUTH_EMAIL_ENABLED === 'true'
export const supabase = createClient(
  url || 'https://unconfigured.supabase.co',
  key || 'not-configured',
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'tafaseel-auth-v1',
    },
  },
)
export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'اكتب الاسم كاملًا.').max(100),
  phone: z
    .string()
    .transform((v) =>
      v.replace(/[\s-]/g, '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))),
    )
    .pipe(z.string().regex(/^\+?[0-9]{9,15}$/, 'اكتب رقم جوال صحيحًا، مثل 05XXXXXXXX.')),
  city: z.string().trim().max(100),
  education_level: z.string().max(100),
})
export function errorMessage(error: unknown): string {
  const e = error as { message?: string; code?: string }
  const text = e?.message || ''
  if (
    e?.code === 'invalid_credentials' ||
    /Invalid login credentials|invalid_credentials/i.test(text)
  )
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  if (/Email not confirmed/i.test(text)) return 'فعّل بريدك الإلكتروني من رسالة التأكيد أولًا.'
  if (/User already registered|ACCOUNT_EXISTS/i.test(text))
    return 'هذا البريد مسجل. يمكنك تسجيل الدخول إلى حسابك.'
  if (/RATE_LIMIT|rate limit|too many|over_email_send_rate_limit/i.test(text))
    return 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.'
  if (/FILE_TOO_LARGE/.test(text)) return 'حجم المرفق يتجاوز 20 ميجابايت.'
  if (/FILE_TYPE_NOT_ALLOWED/.test(text)) return 'اختر ملف PDF أو صورة JPG أو PNG أو WebP.'
  if (/INVALID_DATES/.test(text)) return 'تاريخ النهاية يجب ألا يسبق تاريخ البداية.'
  if (/COHORT_CAPACITY_TOO_SMALL/.test(text))
    return 'عدد المقاعد أقل من عدد المسجلين في هذه الدفعة.'
  if (/MATERIAL_UNAVAILABLE/.test(text))
    return 'المرفق غير متاح في حسابك. حدّث الصفحة أو راجع الإدارة.'
  if (/COHORT_FULL/.test(text)) return 'اكتمل عدد المقاعد في هذه الدفعة. اختر دفعة أخرى.'
  if (/BOOKING_VIA_WHATSAPP/.test(text))
    return `الحجز وتأكيده عبر واتساب المركز: ${contact.displayWhatsApp}.`
  if (/COHORT_MISMATCH/.test(text)) return 'الدفعة المحددة لا تتبع هذا الكورس.'
  if (/INVALID_PAYMENT_AMOUNT/.test(text))
    return 'المبلغ يجب أن يكون موجبًا وألا يتجاوز المتبقي، وبمنزلتين عشريتين كحد أقصى.'
  if (/INVOICE_HAS_PAYMENTS/.test(text)) return 'ألغِ الحركات المالية المرتبطة قبل إلغاء المطالبة.'
  if (/PAYMENT_CONFLICT/.test(text)) return 'تعارض في تسجيل الدفعة. حدّث البيانات قبل المحاولة.'
  if (/UNAUTHORIZED|FORBIDDEN|row-level security|permission denied/i.test(text))
    return 'لا تتوفر صلاحية لهذا الإجراء. أعد تسجيل الدخول إذا انتهت جلستك.'
  if (/ADMIN_ACCOUNT_PROTECTED/.test(text)) return 'لا يمكن إيقاف حساب الإدارة من قائمة المتدربين.'
  if (/weak_password|Password should|password.*contain/i.test(text))
    return 'استخدم 10 أحرف على الأقل، تشمل حرفًا إنجليزيًا كبيرًا وصغيرًا ورقمًا.'
  if (/fetch|network|Failed to/i.test(text))
    return 'تعذّر الاتصال بالخدمة. تحقق من الإنترنت وأعد المحاولة.'
  if (e?.code === '23505') return 'هذا السجل موجود بالفعل.'
  if (e?.code === '23514' || e?.code === '23502')
    return 'تحقق من الحقول المطلوبة وصحة القيم المدخلة.'
  return 'تعذّر إتمام العملية. حاول مجددًا، أو تواصل مع الإدارة إذا استمرت المشكلة.'
}
export const money = (n: number | string) =>
  `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(Number(n))} ر.س`
export const dateLabel = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', calendar: 'gregory' }).format(
        new Date(date),
      )
    : 'غير محدد'
export const statusLabels: Record<string, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  draft: 'مسودة',
  archived: 'مؤرشف',
  pending: 'بانتظار القبول',
  paused: 'متوقف مؤقتًا',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  upcoming: 'قادمة',
  issued: 'مستحقة',
  void: 'ملغاة',
  posted: 'مسجلة',
  open: 'مفتوح',
  closed: 'مغلق',
}
export const paymentMethods: Record<string, string> = {
  bank_transfer: 'تحويل بنكي',
  cash: 'نقدًا',
  card: 'بطاقة — تحصيل خارجي',
}
export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string
  city: string
  education_level: string
  status: string
  created_at: string
  updated_at: string
  must_change_password: boolean
}
export type CourseRecord = {
  id: string
  title: string
  summary: string
  category: string
  group_id: string
  is_listed: boolean
  sort_order: number
  image_path: string
  details: Record<string, unknown>
  level: string
  status: string
  price: number | null
  duration_hours: number | null
  created_at: string
}
export type Cohort = {
  id: string
  course_id: string
  name: string
  starts_at: string | null
  ends_at: string | null
  schedule: string
  meeting_url: string
  capacity: number
  status: string
  created_at: string
}
export type Enrollment = {
  id: string
  user_id: string
  course_id: string
  cohort_id: string | null
  status: string
  created_at: string
}
export type Lesson = {
  id: string
  course_id: string
  module: string
  title: string
  content: string
  video_url: string
  file_path: string
  duration_minutes: number
  position: number
  is_published: boolean
}
export type Progress = {
  user_id: string
  lesson_id: string
  completed: boolean
  updated_at: string
}
export type Invoice = {
  id: string
  enrollment_id: string
  title: string
  amount: number
  due_date: string
  status: string
  created_at: string
}
export type Payment = {
  id: string
  invoice_id: string
  amount: number
  method: string
  reference: string
  note: string
  status: string
  created_at: string
}
export type Ticket = {
  id: string
  user_id: string
  subject: string
  body: string
  status: string
  reply: string
  created_at: string
}
export type Announcement = {
  id: string
  course_id: string | null
  title: string
  body: string
  is_published: boolean
  created_at: string
}
export type Audit = {
  id: number
  actor_id: string | null
  action: string
  table_name: string
  record_id: string
  created_at: string
}
export type PlatformData = {
  profiles: Profile[]
  courses: CourseRecord[]
  cohorts: Cohort[]
  enrollments: Enrollment[]
  lessons: Lesson[]
  lesson_progress: Progress[]
  invoices: Invoice[]
  payments: Payment[]
  support_tickets: Ticket[]
  announcements: Announcement[]
  audit_logs: Audit[]
  admin_users: { user_id: string }[]
}
export async function fetchAllRows(table: string, signal?: AbortSignal) {
  let rows: unknown[] = []
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from(table)
      .select('*')
      .range(from, from + 999)
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query
    if (error) throw error
    rows = rows.concat(data)
    if (data.length < 1000) break
  }
  return rows
}
export async function loadPlatform(admin = false, signal?: AbortSignal): Promise<PlatformData> {
  const tables = [
    'profiles',
    'courses',
    'cohorts',
    'enrollments',
    'lessons',
    'lesson_progress',
    'invoices',
    'payments',
    'support_tickets',
    'announcements',
    ...(admin ? ['audit_logs', 'admin_users'] : []),
  ]
  const entries = await Promise.all(
    tables.map(async (table) => [table, await fetchAllRows(table, signal)]),
  )
  return { audit_logs: [], admin_users: [], ...Object.fromEntries(entries) } as PlatformData
}
export function invoicePaid(invoice: Invoice, payments: Payment[]) {
  return payments
    .filter((p) => p.invoice_id === invoice.id && p.status === 'posted')
    .reduce((n, p) => n + Number(p.amount), 0)
}
export function invoiceStatus(invoice: Invoice, payments: Payment[]) {
  if (invoice.status === 'void') return 'ملغاة'
  if (invoicePaid(invoice, payments) >= Number(invoice.amount)) return 'مسددة'
  if (invoice.due_date < new Date().toLocaleDateString('en-CA')) return 'متأخرة'
  return invoicePaid(invoice, payments) > 0 ? 'مسددة جزئيًا' : 'مستحقة'
}
export function safeHttps(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}
export async function accountAction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) {
    if (error.context instanceof Response) {
      const result = await error.context.json().catch(() => ({}))
      throw new Error(result.error || 'OPERATION_FAILED')
    }
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data as { ok?: boolean; user_id?: string; password?: string }
}

export async function downloadLessonMaterial(lessonId: string): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('course-material', {
    body: { lesson_id: lessonId },
  })
  if (error) throw error
  if (!(data instanceof Blob)) throw Error('MATERIAL_UNAVAILABLE')
  return data
}
