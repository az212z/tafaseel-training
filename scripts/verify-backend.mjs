import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const localKeys = fs.existsSync('.secrets/api-keys.json')
  ? JSON.parse(fs.readFileSync('.secrets/api-keys.json', 'utf8'))
  : []
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || localKeys.find((k) => k.name === 'service_role')?.api_key
assert(
  url && anonKey && serviceKey,
  'Configure a dedicated backend and service key before running integration tests.',
)
const client = (key) =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const service = client(serviceKey),
  anon = client(anonKey),
  run = Date.now(),
  courseId = `qa-${run}`,
  users = [],
  checks = []
let cohortId, lessonId, privateFile
const qa = {}
async function ok(label, fn) {
  await fn()
  checks.push(label)
  console.log('PASS', label)
}
function checked(result) {
  if (result.error) throw result.error
  return result.data
}
async function denied(result) {
  assert(result.error || !result.data || result.data.length === 0, 'Unexpected access granted')
}
async function createUser(label, isAdmin = false) {
  const email = `tafaseel-qa-${label}-${run}@example.test`,
    password = 'Tf' + randomBytes(15).toString('hex') + '9!'
  const r = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `اختبار ${label === 'admin' ? 'الإدارة' : label === 'learner' ? 'المتدرب' : 'العزل'}`,
      phone: '0500000000',
      city: 'بيانات اختبار مؤقتة',
      education_level: 'المرحلة الثانوية',
    },
  })
  const user = checked(r).user
  users.push(user.id)
  if (isAdmin) checked(await service.from('admin_users').insert({ user_id: user.id }))
  const c = client(anonKey),
    session = checked(await c.auth.signInWithPassword({ email, password })).session
  qa[label] = { id: user.id, email, password, session }
  return c
}
async function cleanup() {
  const audit = await service.from('audit_logs').select('id').in('actor_id', users)
  if (audit.data?.length)
    await service
      .from('audit_logs')
      .delete()
      .in(
        'id',
        audit.data.map((x) => x.id),
      )
  if (privateFile) await service.storage.from('course-materials').remove([privateFile])
  for (const id of users) await service.auth.admin.deleteUser(id)
  await service.from('lessons').delete().eq('course_id', courseId)
  await service.from('cohorts').delete().eq('course_id', courseId)
  await service.from('courses').delete().eq('id', courseId)
  await service
    .from('audit_logs')
    .delete()
    .or(
      `record_id.eq.${courseId},record_id.eq.${cohortId || 'none'},record_id.eq.${lessonId || 'none'},actor_id.is.null`,
    )
    .like('record_id', `qa-${run}%`)
}
let failed = false
try {
  const admin = await createUser('admin', true),
    learner = await createUser('learner'),
    other = await createUser('other')
  await ok('Anonymous requests expose no learner profiles', async () => {
    await denied(await anon.from('profiles').select('*'))
    await denied(await anon.from('payments').select('*'))
    await denied(await anon.from('lessons').select('*'))
  })
  await ok('Authenticated profile isolation', async () => {
    const rows = checked(await learner.from('profiles').select('*'))
    assert.equal(rows.length, 1)
    assert.equal(rows[0].id, qa.learner.id)
  })
  await ok('Client cannot self-promote or modify profile status', async () => {
    await denied(await learner.from('admin_users').insert({ user_id: qa.learner.id }))
    await denied(
      await learner.from('profiles').update({ status: 'suspended' }).eq('id', qa.other.id),
    )
    checked(await learner.auth.updateUser({ data: { role: 'admin', is_admin: true } }))
    assert.equal(checked(await learner.rpc('is_admin')), false)
  })
  await ok('Create course, private lesson, and cohort through admin permissions', async () => {
    checked(
      await admin.from('courses').insert({
        id: courseId,
        title: 'كورس اختبار مؤقت',
        summary: 'بيانات مؤقتة للتحقق من النظام',
        status: 'active',
        category: 'شامل',
        is_listed: false,
      }),
    )
    cohortId = checked(
      await admin
        .from('cohorts')
        .insert({
          course_id: courseId,
          name: 'دفعة اختبار مؤقتة',
          capacity: 1,
          status: 'active',
          schedule: 'موعد تجريبي للتحقق فقط',
          starts_at: '2026-09-14',
          ends_at: '2026-10-14',
        })
        .select()
        .single(),
    ).id
    lessonId = checked(
      await admin
        .from('lessons')
        .insert({
          course_id: courseId,
          title: 'درس التحقق من الصلاحيات',
          module: 'وحدة الاختبار',
          content:
            '## فكرة التدريب\nهذا محتوى مؤقت للتحقق من إتاحة الدروس للحساب المسجل فقط.\nإذا كان ٣س = ١٥، نقسم الطرفين على ٣ فنحصل على س = ٥.',
          is_published: true,
        })
        .select()
        .single(),
    ).id
  })
  await ok(
    'Booking is WhatsApp-only; pending admin registration does not unlock lessons',
    async () => {
      const booking = await learner.rpc('request_enrollment', { p_course: courseId })
      assert.match(booking.error?.message || '', /BOOKING_VIA_WHATSAPP/)
      checked(
        await admin.rpc('admin_enroll', {
          p_user: qa.learner.id,
          p_course: courseId,
          p_cohort: null,
          p_status: 'pending',
        }),
      )
      const e = checked(await learner.from('enrollments').select('*'))
      assert.equal(e[0].status, 'pending')
      await denied(await learner.from('lessons').select('*').eq('id', lessonId))
      await denied(
        await learner.rpc('admin_enroll', {
          p_user: qa.learner.id,
          p_course: courseId,
          p_cohort: cohortId,
          p_status: 'active',
        }),
      )
      await denied(
        await learner.from('enrollments').update({ status: 'active' }).eq('user_id', qa.learner.id),
      )
    },
  )
  await ok('Admin acceptance unlocks only assigned student course and cohort', async () => {
    checked(
      await admin.rpc('admin_enroll', {
        p_user: qa.learner.id,
        p_course: courseId,
        p_cohort: cohortId,
        p_status: 'active',
      }),
    )
    assert.equal(checked(await learner.from('lessons').select('*').eq('id', lessonId)).length, 1)
    assert.equal(checked(await learner.from('cohorts').select('*').eq('id', cohortId)).length, 1)
    await denied(await other.from('lessons').select('*').eq('id', lessonId))
    await denied(await other.from('cohorts').select('*').eq('id', cohortId))
  })
  await ok('Cohort capacity enforced inside transaction', async () => {
    const r = await admin.rpc('admin_enroll', {
      p_user: qa.other.id,
      p_course: courseId,
      p_cohort: cohortId,
      p_status: 'active',
    })
    assert.match(r.error?.message || '', /COHORT_FULL/)
  })
  await ok('Learning progress persists and cross-user writes are rejected', async () => {
    checked(
      await learner
        .from('lesson_progress')
        .upsert({ user_id: qa.learner.id, lesson_id: lessonId, completed: true }),
    )
    assert.equal(checked(await learner.from('lesson_progress').select('*'))[0].completed, true)
    await denied(await other.from('lesson_progress').select('*').eq('user_id', qa.learner.id))
    await denied(
      await other
        .from('lesson_progress')
        .upsert({ user_id: qa.learner.id, lesson_id: lessonId, completed: false }),
    )
    checked(
      await learner.from('learning_states').upsert({
        user_id: qa.learner.id,
        state: {
          version: 1,
          attempts: [],
          savedCourses: ['foundation'],
          plan: [0, 1],
          draft: null,
          session: null,
        },
      }),
    )
    await denied(await other.from('learning_states').select('*').eq('user_id', qa.learner.id))
  })
  const enrollment = checked(
    await admin
      .from('enrollments')
      .select('*')
      .eq('user_id', qa.learner.id)
      .eq('course_id', courseId)
      .single(),
  )
  const invoiceId = checked(
    await admin.rpc('admin_create_invoice', {
      p_enrollment: enrollment.id,
      p_title: 'قسط اختبار مؤقت',
      p_amount: 100,
      p_due: '2026-09-20',
    }),
  )
  const paymentId = crypto.randomUUID()
  await ok(
    'Financial transactions require admin, are idempotent and reject overpayment',
    async () => {
      await denied(
        await learner.rpc('admin_record_payment', {
          p_id: paymentId,
          p_invoice: invoiceId,
          p_amount: 40,
          p_method: 'cash',
        }),
      )
      const payload = {
        p_id: paymentId,
        p_invoice: invoiceId,
        p_amount: 40,
        p_method: 'bank_transfer',
        p_reference: 'QA temporary',
      }
      checked(await admin.rpc('admin_record_payment', payload))
      checked(await admin.rpc('admin_record_payment', payload))
      assert.equal(checked(await admin.from('payments').select('*').eq('id', paymentId)).length, 1)
      assert((await admin.rpc('admin_record_payment', { ...payload, p_amount: 41 })).error)
      assert(
        (
          await admin.rpc('admin_record_payment', {
            ...payload,
            p_id: crypto.randomUUID(),
            p_amount: 61,
          })
        ).error,
      )
      await denied(
        await learner
          .from('payments')
          .insert({ invoice_id: invoiceId, amount: 10, method: 'cash' }),
      )
      await denied(await other.from('invoices').select('*').eq('id', invoiceId))
      await denied(await other.from('payments').select('*').eq('invoice_id', invoiceId))
    },
  )
  await ok('Concurrent payments cannot exceed invoice balance', async () => {
    const results = await Promise.all(
      [1, 2].map(() =>
        admin.rpc('admin_record_payment', {
          p_id: crypto.randomUUID(),
          p_invoice: invoiceId,
          p_amount: 50,
          p_method: 'cash',
        }),
      ),
    )
    assert.equal(results.filter((r) => !r.error).length, 1)
    assert.equal(
      checked(await admin.from('payments').select('*').eq('invoice_id', invoiceId)).reduce(
        (n, p) => n + Number(p.amount),
        0,
      ),
      90,
    )
  })
  await ok('Voiding has an audit trail and invoices with payments cannot be voided', async () => {
    assert(
      (await admin.rpc('admin_void_financial_record', { p_kind: 'invoice', p_id: invoiceId }))
        .error,
    )
    checked(await admin.rpc('admin_void_financial_record', { p_kind: 'payment', p_id: paymentId }))
    assert.equal(
      checked(await admin.from('payments').select('status').eq('id', paymentId).single()).status,
      'void',
    )
    assert(
      checked(await admin.from('audit_logs').select('*').eq('record_id', paymentId)).length >= 2,
    )
  })
  await ok('Private messages and admin replies respect account isolation', async () => {
    checked(
      await learner.rpc('submit_ticket', {
        p_subject: 'استفسار اختبار',
        p_body: 'رسالة اختبار مؤقتة للتحقق من الخصوصية.',
      }),
    )
    const ticket = checked(await learner.from('support_tickets').select('*'))[0]
    checked(
      await admin.rpc('admin_reply_ticket', {
        p_id: ticket.id,
        p_reply: 'تم التحقق من وصول الرسالة بنجاح.',
        p_status: 'closed',
      }),
    )
    assert.equal(checked(await learner.from('support_tickets').select('*'))[0].status, 'closed')
    await denied(await other.from('support_tickets').select('*').eq('id', ticket.id))
    await denied(
      await learner.rpc('admin_reply_ticket', {
        p_id: ticket.id,
        p_reply: 'forged',
        p_status: 'closed',
      }),
    )
  })
  await ok('Course files are private and accessible only through course membership', async () => {
    privateFile = `${courseId}/qa-${run}.pdf`
    checked(
      await admin.storage
        .from('course-materials')
        .upload(
          privateFile,
          new Blob(['%PDF-1.4\nQA temporary document\n%%EOF'], { type: 'application/pdf' }),
          { contentType: 'application/pdf', cacheControl: '0' },
        ),
    )
    checked(await admin.from('lessons').update({ file_path: privateFile }).eq('id', lessonId))
    assert(
      !(await learner.functions.invoke('course-material', { body: { lesson_id: lessonId } })).error,
    )
    assert(
      (await other.functions.invoke('course-material', { body: { lesson_id: lessonId } })).error,
    )
    assert((await learner.storage.from('course-materials').download(privateFile)).error)
    const publicResponse = await fetch(
      `${url}/storage/v1/object/public/course-materials/${privateFile}`,
    )
    assert(!publicResponse.ok)
  })
  await ok('Suspension immediately prevents learning access', async () => {
    checked(
      await admin.rpc('admin_set_student_status', { p_user: qa.learner.id, p_status: 'suspended' }),
    )
    await denied(await learner.from('lessons').select('*').eq('id', lessonId))
    assert(
      (await learner.rpc('submit_ticket', { p_subject: 'blocked', p_body: 'blocked request' }))
        .error,
    )
    assert(
      (await learner.functions.invoke('course-material', { body: { lesson_id: lessonId } })).error,
    )
    checked(
      await admin.rpc('admin_set_student_status', { p_user: qa.learner.id, p_status: 'active' }),
    )
  })
  await ok('Edge account management rejects unauthenticated and student callers', async () => {
    const request = await fetch(`${url}/functions/v1/admin-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', user_id: qa.other.id }),
    })
    assert.equal(request.status, 401)
    assert(
      (
        await learner.functions.invoke('admin-users', {
          body: { action: 'reset', user_id: qa.other.id },
        })
      ).error,
    )
  })
  await ok(
    'Password reset forces password change; protected admin accounts cannot be reset',
    async () => {
      const r = checked(
        await admin.functions.invoke('admin-users', {
          body: { action: 'reset', user_id: qa.other.id },
        }),
      )
      assert(r.password)
      const c = client(anonKey)
      checked(await c.auth.signInWithPassword({ email: qa.other.email, password: r.password }))
      assert.equal(
        checked(await c.from('profiles').select('*').single()).must_change_password,
        true,
      )
      assert.equal(checked(await c.rpc('is_active_user')), false)
      const newPassword = 'Tf' + randomBytes(15).toString('hex') + '9!'
      checked(
        await c.functions.invoke('admin-users', {
          body: { action: 'change_password', current_password: r.password, password: newPassword },
        }),
      )
      assert.equal(
        checked(await c.from('profiles').select('*').single()).must_change_password,
        false,
      )
      const oldLogin = await client(anonKey).auth.signInWithPassword({
        email: qa.other.email,
        password: r.password,
      })
      assert(oldLogin.error)
      assert(
        (
          await admin.functions.invoke('admin-users', {
            body: { action: 'reset', user_id: qa.admin.id },
          })
        ).error,
      )
    },
  )
  await ok('Public self-registration requires valid learner profile and password', async () => {
    const c = client(anonKey),
      email = `tafaseel-qa-signup-${run}@example.test`,
      password = 'Tf' + randomBytes(15).toString('hex') + '9!'
    const r = await c.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'اختبار التسجيل الذاتي', phone: '0500000001' } },
    })
    checked(r)
    users.push(r.data.user.id)
    assert(r.data.session)
    assert.equal(checked(await c.from('profiles').select('*').single()).phone, '0500000001')
    const invalid = await client(anonKey).auth.signUp({
      email: `tafaseel-qa-invalid-${run}@example.test`,
      password,
      options: { data: { full_name: 'اختبار', phone: 'bad' } },
    })
    assert(invalid.error)
  })
  qa.courseId = courseId
  qa.cohortId = cohortId
  qa.lessonId = lessonId
  qa.privateFile = privateFile
  qa.userIds = users
  qa.invoiceId = invoiceId
  qa.run = run
  fs.writeFileSync(
    'output/backend/verification.json',
    JSON.stringify(
      { checked: checks.length, passed: checks.length, checks, at: new Date().toISOString() },
      null,
      2,
    ),
  )
  if (process.argv.includes('--keep-fixtures')) {
    fs.writeFileSync('.secrets/qa.json', JSON.stringify(qa), { mode: 0o600 })
    console.log('QA fixtures kept temporarily for browser verification; cleanup required.')
  } else await cleanup()
} catch (e) {
  failed = true
  console.error('FAIL', e.message)
  await cleanup()
  process.exitCode = 1
} finally {
  if (!failed) console.log(`Verified ${checks.length} backend checks.`)
}
