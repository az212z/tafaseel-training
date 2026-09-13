import { useState } from 'react'
import { ChatCircleText, PencilSimple, Plus } from '@phosphor-icons/react'
import { Badge, Empty, Modal, MutationForm, Panel } from '../../components/portal/PortalUI'
import { dateLabel, supabase } from '../../services/backend'
import type { Announcement, PlatformData } from '../../services/backend'
import { useLearning } from '../../services/context'
export default function AdminMessages({
  data,
  refresh,
}: {
  data: PlatformData
  refresh: () => Promise<void>
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [editing, setEditing] = useState<Announcement | 'new' | null>(null),
    [filter, setFilter] = useState('open'),
    { notify } = useLearning(),
    ticket = data.support_tickets.find((t) => t.id === selected),
    announcement = editing && editing !== 'new' ? editing : null,
    rows = data.support_tickets.filter((t) => filter === 'all' || t.status === filter)
  return (
    <>
      <Panel title="صندوق الرسائل" description="استفسارات المتدربين والردود الخاصة بكل حساب.">
        <div className="portal-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="تصفية حالة الرسائل"
          >
            <option value="open">المفتوحة</option>
            <option value="closed">المغلقة</option>
            <option value="all">جميع الرسائل</option>
          </select>
        </div>
        {rows.length ? (
          <div className="portal-table-wrap" tabIndex={0} role="region" aria-label="جدول البيانات">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>المتدرب</th>
                  <th>الموضوع</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .reverse()
                  .map((t) => (
                    <tr key={t.id}>
                      <td>{data.profiles.find((p) => p.id === t.user_id)?.full_name}</td>
                      <td>
                        <strong>{t.subject}</strong>
                      </td>
                      <td>{dateLabel(t.created_at)}</td>
                      <td>
                        <Badge status={t.status} />
                      </td>
                      <td>
                        <button className="text-link" onClick={() => setSelected(t.id)}>
                          عرض والرد
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="لا توجد رسائل بهذه الحالة"
            description="تظهر رسائل المتدربين هنا فور إرسالها من حساباتهم."
            icon={<ChatCircleText size={36} />}
          />
        )}
      </Panel>
      <Panel
        title="إعلانات المتدربين"
        description="انشر تحديثًا لجميع المتدربين أو للمسجلين في كورس محدد."
        action={
          <button className="button button-small" onClick={() => setEditing('new')}>
            <Plus size={18} /> إعلان جديد
          </button>
        }
      >
        {data.announcements.length ? (
          <div className="admin-announcements">
            {data.announcements
              .slice()
              .reverse()
              .map((a) => (
                <article className="announcement" key={a.id}>
                  <div className="inline-actions">
                    <small>
                      {a.course_id
                        ? data.courses.find((c) => c.id === a.course_id)?.title
                        : 'جميع المتدربين'}{' '}
                      · {dateLabel(a.created_at)}
                    </small>
                    <Badge
                      status={a.is_published ? 'active' : 'draft'}
                      label={a.is_published ? 'منشور' : 'مسودة'}
                    />
                    <button
                      className="icon-button"
                      aria-label={`تحرير ${a.title}`}
                      onClick={() => setEditing(a)}
                    >
                      <PencilSimple size={20} />
                    </button>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </article>
              ))}
          </div>
        ) : (
          <Empty
            title="لم يُنشر أي إعلان بعد"
            description="أضف تنبيهًا عن موعد، محتوى جديد، أو تحديث يهم المتدربين."
          />
        )}
      </Panel>
      {ticket && (
        <Modal title="الرد على رسالة المتدرب" onClose={() => setSelected(null)} wide>
          <div className="ticket-card">
            <small>
              {data.profiles.find((p) => p.id === ticket.user_id)?.full_name} ·{' '}
              {dateLabel(ticket.created_at)}
            </small>
            <h3>{ticket.subject}</h3>
            <p>{ticket.body}</p>
          </div>
          <MutationForm
            submit="حفظ الرد"
            onSubmit={async (f) => {
              const { error } = await supabase.rpc('admin_reply_ticket', {
                p_id: ticket.id,
                p_reply: f.get('reply'),
                p_status: f.get('status'),
              })
              if (error) throw error
            }}
            onDone={() => {
              setSelected(null)
              void refresh()
              notify('تم حفظ الرد وإتاحته في حساب المتدرب.')
            }}
          >
            <label>
              رد الإدارة
              <textarea
                name="reply"
                rows={5}
                required
                minLength={2}
                maxLength={5000}
                defaultValue={ticket.reply}
              />
            </label>
            <label>
              حالة الرسالة
              <select name="status" defaultValue="closed">
                <option value="closed">مغلقة — تم الرد</option>
                <option value="open">مفتوحة — تحتاج متابعة</option>
              </select>
            </label>
            <p className="field-hint">يظهر الرد داخل حساب المتدرب. لا تُرسل رسالة بريد إلكتروني.</p>
          </MutationForm>
        </Modal>
      )}
      {editing && (
        <Modal
          title={editing === 'new' ? 'إعلان جديد' : 'تعديل الإعلان'}
          onClose={() => setEditing(null)}
        >
          <MutationForm
            onSubmit={async (f) => {
              const value = {
                title: f.get('title'),
                body: f.get('body'),
                course_id: f.get('course_id') || null,
                is_published: f.get('is_published') === 'on',
              }
              const { error } = announcement
                ? await supabase.from('announcements').update(value).eq('id', announcement.id)
                : await supabase.from('announcements').insert(value)
              if (error) throw error
            }}
            onDone={() => {
              setEditing(null)
              void refresh()
              notify('تم حفظ الإعلان.')
            }}
          >
            <label>
              العنوان
              <input
                name="title"
                required
                minLength={2}
                maxLength={160}
                defaultValue={announcement?.title}
              />
            </label>
            <label>
              نص الإعلان
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={5000}
                rows={5}
                defaultValue={announcement?.body}
              />
            </label>
            <label>
              الجمهور
              <select name="course_id" defaultValue={announcement?.course_id || ''}>
                <option value="">جميع المتدربين</option>
                {data.courses.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="consent-field">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked={announcement?.is_published}
              />
              <span>نشر الإعلان في حسابات المتدربين</span>
            </label>
          </MutationForm>
        </Modal>
      )}
    </>
  )
}
