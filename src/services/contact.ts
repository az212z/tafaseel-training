export const contact = {
  phone: '+966558815053',
  displayPhone: '٠٥٥٨٨١٥٠٥٣',
  whatsappNumber: '966558815053',
  instagram: '',
  snapchat: '',
}
export function whatsappUrl(courseTitle?: string) {
  const message = courseTitle
    ? `السلام عليكم، أرغب في حجز دورة «${courseTitle}» لدى مركز تفاصيل للتدريب. فضلاً تزويدي بالمواعيد المتاحة والرسوم ومتطلبات الدورة لتأكيد الحجز.`
    : 'السلام عليكم، أرغب في الاستفسار عن دورات مركز تفاصيل للتدريب والمواعيد المتاحة وخطوات تأكيد الحجز.'
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function bookingPath(courseId?: string) {
  return courseId ? `/booking?course=${encodeURIComponent(courseId)}` : '/booking'
}

export function normalizeBookingPhone(value: string) {
  const digits = value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[\s()-]/g, '')
  if (/^05\d{8}$/.test(digits)) return `+966${digits.slice(1)}`
  if (/^(?:\+|00)?9665\d{8}$/.test(digits)) return `+${digits.replace(/^(?:\+|00)/, '')}`
  return ''
}

export type BookingRequest = {
  name: string
  phone: string
  course: string
  email: string
  city: string
  notes: string
}

export function bookingWhatsAppUrl(request: BookingRequest) {
  const message = [
    'السلام عليكم، أرغب في حجز دورة لدى مركز تفاصيل للتدريب.',
    '',
    `الدورة: ${request.course}`,
    `الاسم: ${request.name}`,
    `رقم الجوال: ${request.phone}`,
    request.email ? `البريد الإلكتروني: ${request.email}` : null,
    request.city ? `المدينة: ${request.city}` : null,
    request.notes ? `ملاحظات: ${request.notes}` : null,
    '',
    'فضلاً تزويدي بالمواعيد المتاحة والرسوم ومتطلبات الدورة لاستكمال الحجز وتأكيده.',
  ]
    .filter((line) => line !== null)
    .join('\n')
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`
}
