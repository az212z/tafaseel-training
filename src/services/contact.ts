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
