import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarBlank, CheckCircle, Plus, Receipt } from '@phosphor-icons/react'
import {
  Badge,
  DownloadCsv,
  Empty,
  Modal,
  MutationForm,
  Panel,
  Stat,
} from '../../components/portal/PortalUI'
import {
  dateLabel,
  invoicePaid,
  invoiceStatus,
  money,
  paymentMethods,
  supabase,
} from '../../services/backend'
import type { Invoice, PlatformData } from '../../services/backend'
import { ReceiptDetail } from '../Dashboard'
import { useLearning } from '../../services/context'
export default function AdminFinance({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const [params] = useSearchParams(),
    [student, setStudent] = useState(params.get('student') || ''),
    [filter, setFilter] = useState('all'),
    [create, setCreate] = useState(false),
    [payment, setPayment] = useState<{ invoice: Invoice; id: string } | null>(null),
    [receipt, setReceipt] = useState<Invoice | null>(null),
    [voidRecord, setVoidRecord] = useState<{ kind: string; id: string } | null>(null),
    { notify } = useLearning()
  const allInvoices = data.invoices.filter(
      (i) =>
        !student || data.enrollments.some((e) => e.id === i.enrollment_id && e.user_id === student),
    ),
    valid = allInvoices.filter((i) => i.status !== 'void'),
    invoices = allInvoices.filter(
      (i) => filter === 'all' || invoiceStatus(i, data.payments) === filter,
    ),
    total = valid.reduce((n, i) => n + Number(i.amount), 0),
    paid = valid.reduce((n, i) => n + invoicePaid(i, data.payments), 0),
    payments = data.payments.filter((p) => allInvoices.some((i) => i.id === p.invoice_id))
  const studentName = (i: Invoice) =>
    data.profiles.find(
      (p) => p.id === data.enrollments.find((e) => e.id === i.enrollment_id)?.user_id,
    )?.full_name || 'متدرب'
  return (
    <>
      <div className="portal-stats three-stats">
        <Stat label="الرسوم المسجلة" value={money(total)} icon={<Receipt />} />
        <Stat label="التحصيل المسجل" value={money(paid)} icon={<CheckCircle />} tone="green" />
        <Stat
          label="المتبقي للتحصيل"
          value={money(total - paid)}
          icon={<CalendarBlank />}
          tone="sand"
        />
      </div>
      <div className="form-notice">
        سجل متابعة للتحصيل الفعلي لدى المركز. إضافة حركة سداد لا تنفّذ خصمًا من بطاقة أو حساب بنكي.
      </div>
      <Panel
        title="المطالبات والأقساط"
        description="قسّم الرسوم على أقساط وحدّد مواعيد استحقاقها."
        action={
          <div className="inline-actions">
            <DownloadCsv
              filename="رسوم-تفاصيل.csv"
              rows={[
                ['المتدرب', 'المطالبة', 'المبلغ', 'المسدد', 'المتبقي', 'الاستحقاق', 'الحالة'],
                ...invoices.map((i) => [
                  studentName(i),
                  i.title,
                  i.amount,
                  invoicePaid(i, data.payments),
                  i.status === 'void' ? 0 : Number(i.amount) - invoicePaid(i, data.payments),
                  i.due_date,
                  invoiceStatus(i, data.payments),
                ]),
              ]}
            />
            <button className="button button-small" onClick={() => setCreate(true)}>
              <Plus size={18} /> إضافة مطالبة
            </button>
          </div>
        }
      >
        <div className="portal-filters">
          <select
            aria-label="تصفية الرسوم حسب المتدرب"
            value={student}
            onChange={(e) => setStudent(e.target.value)}
          >
            <option value="">جميع المتدربين</option>
            {data.profiles
              .filter((p) => !data.admin_users.some((a) => a.user_id === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>
          <select
            aria-label="تصفية حسب حالة السداد"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">كل حالات السداد</option>
            {['مستحقة', 'مسددة جزئيًا', 'مسددة', 'متأخرة', 'ملغاة'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {invoices.length ? (
          <div className="portal-table-wrap" tabIndex={0} role="region" aria-label="جدول البيانات">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>المتدرب / المطالبة</th>
                  <th>الاستحقاق</th>
                  <th>المبلغ</th>
                  <th>المسدد</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .slice()
                  .reverse()
                  .map((i) => {
                    const due = Number(i.amount) - invoicePaid(i, data.payments)
                    return (
                      <tr key={i.id}>
                        <td>
                          <strong>{studentName(i)}</strong>
                          <small>{i.title}</small>
                        </td>
                        <td>{dateLabel(i.due_date)}</td>
                        <td>{money(i.amount)}</td>
                        <td>{money(invoicePaid(i, data.payments))}</td>
                        <td>
                          <Badge
                            status={
                              due <= 0 ? 'completed' : i.status === 'void' ? 'void' : 'pending'
                            }
                            label={invoiceStatus(i, data.payments)}
                          />
                        </td>
                        <td>
                          <div className="inline-actions">
                            {i.status !== 'void' && due > 0 && (
                              <button
                                className="text-link"
                                onClick={() => setPayment({ invoice: i, id: crypto.randomUUID() })}
                              >
                                تسجيل سداد
                              </button>
                            )}
                            <button className="text-link" onClick={() => setReceipt(i)}>
                              السجل
                            </button>
                            {i.status !== 'void' && invoicePaid(i, data.payments) === 0 && (
                              <button
                                className="text-link muted-action"
                                onClick={() => setVoidRecord({ kind: 'invoice', id: i.id })}
                              >
                                إلغاء
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="لا توجد مطالبات مطابقة"
            description="أضف مطالبة لمتدرب مسجل في كورس، أو غيّر التصفية."
            icon={<Receipt size={36} />}
          />
        )}
      </Panel>
      <Panel
        title="حركات السداد"
        description="كل عملية تحتفظ بتاريخها ومرجعها، وتظل العمليات الملغاة ظاهرة للمراجعة."
      >
        {payments.length ? (
          <div className="portal-table-wrap" tabIndex={0} role="region" aria-label="جدول البيانات">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>المتدرب</th>
                  <th>المبلغ</th>
                  <th>الطريقة</th>
                  <th>المرجع</th>
                  <th>تاريخ التسجيل</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .slice()
                  .reverse()
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{studentName(data.invoices.find((i) => i.id === p.invoice_id)!)}</td>
                      <td>{money(p.amount)}</td>
                      <td>{paymentMethods[p.method]}</td>
                      <td>{p.reference || '—'}</td>
                      <td>{dateLabel(p.created_at)}</td>
                      <td>
                        <Badge status={p.status} />
                      </td>
                      <td>
                        {p.status === 'posted' && (
                          <button
                            className="text-link muted-action"
                            onClick={() => setVoidRecord({ kind: 'payment', id: p.id })}
                          >
                            إلغاء الحركة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="لا توجد حركات سداد" description="يظهر التحصيل هنا بعد تسجيله من الإدارة." />
        )}
      </Panel>
      {create && (
        <Modal title="إضافة مطالبة مالية" onClose={() => setCreate(false)}>
          <MutationForm
            onSubmit={async (f) => {
              const { error } = await supabase.rpc('admin_create_invoice', {
                p_enrollment: f.get('enrollment_id'),
                p_title: f.get('title'),
                p_amount: Number(f.get('amount')),
                p_due: f.get('due_date'),
              })
              if (error) throw error
            }}
            onDone={() => {
              setCreate(false)
              void refresh()
              notify('تمت إضافة المطالبة.')
            }}
          >
            <label>
              التسجيل المرتبط
              <select name="enrollment_id" required defaultValue="">
                <option value="" disabled>
                  اختر المتدرب والكورس
                </option>
                {data.enrollments
                  .filter((e) => e.status !== 'cancelled' && (!student || e.user_id === student))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {data.profiles.find((p) => p.id === e.user_id)?.full_name} —{' '}
                      {data.courses.find((c) => c.id === e.course_id)?.title}
                    </option>
                  ))}
              </select>
            </label>
            {!data.enrollments.length && (
              <p className="form-notice">سجّل المتدرب في كورس أولًا، ثم أضف الرسوم.</p>
            )}
            <label>
              وصف المطالبة
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                placeholder="مثل: القسط الأول من رسوم الكورس"
              />
            </label>
            <div className="form-two-col">
              <label>
                المبلغ (ر.س)
                <input name="amount" type="number" required min="0.01" step="0.01" max="99999999" />
              </label>
              <label>
                تاريخ الاستحقاق
                <input name="due_date" type="date" required />
              </label>
            </div>
          </MutationForm>
        </Modal>
      )}
      {payment && (
        <Modal title="تسجيل سداد مستلم" onClose={() => setPayment(null)}>
          <div className="payment-summary">
            <strong>{studentName(payment.invoice)}</strong>
            <p>{payment.invoice.title}</p>
            <span>
              المتبقي:{' '}
              {money(Number(payment.invoice.amount) - invoicePaid(payment.invoice, data.payments))}
            </span>
          </div>
          <MutationForm
            submit="اعتماد حركة السداد"
            onSubmit={async (f) => {
              const { error } = await supabase.rpc('admin_record_payment', {
                p_id: payment.id,
                p_invoice: payment.invoice.id,
                p_amount: Number(f.get('amount')),
                p_method: f.get('method'),
                p_reference: f.get('reference'),
                p_note: f.get('note'),
              })
              if (error) throw error
            }}
            onDone={() => {
              setPayment(null)
              void refresh()
              notify('تم تسجيل السداد.')
            }}
          >
            <label>
              المبلغ المستلم (ر.س)
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={Number(payment.invoice.amount) - invoicePaid(payment.invoice, data.payments)}
                required
                defaultValue={
                  Number(payment.invoice.amount) - invoicePaid(payment.invoice, data.payments)
                }
              />
            </label>
            <label>
              طريقة التحصيل
              <select name="method">
                {Object.entries(paymentMethods).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              مرجع التحويل أو العملية
              <input name="reference" maxLength={160} />
            </label>
            <label>
              ملاحظة
              <textarea name="note" rows={2} maxLength={500} />
            </label>
            <label className="consent-field">
              <input type="checkbox" required />
              <span>تحققت من استلام المبلغ فعليًا.</span>
            </label>
          </MutationForm>
        </Modal>
      )}
      {voidRecord && (
        <Modal
          title={voidRecord.kind === 'invoice' ? 'إلغاء المطالبة؟' : 'إلغاء حركة السداد؟'}
          onClose={() => setVoidRecord(null)}
        >
          <MutationForm
            submit="تأكيد الإلغاء"
            onSubmit={async () => {
              const { error } = await supabase.rpc('admin_void_financial_record', {
                p_kind: voidRecord.kind,
                p_id: voidRecord.id,
              })
              if (error) throw error
            }}
            onDone={() => {
              setVoidRecord(null)
              void refresh()
              notify('تم إلغاء السجل مع الاحتفاظ بأثر المراجعة.')
            }}
          >
            <p className="form-notice">
              سيُحدّث الرصيد، ويحتفظ النظام بالسجل الملغى للمراجعة. إلغاء الحركة هنا لا يُرجع
              أموالًا إلى المتدرب.
            </p>
          </MutationForm>
        </Modal>
      )}
      {receipt && (
        <Modal title="السجل المالي" onClose={() => setReceipt(null)} wide>
          <ReceiptDetail
            invoice={data.invoices.find((i) => i.id === receipt.id) || receipt}
            data={data}
          />
        </Modal>
      )}
    </>
  )
}
