import { supabase } from './backend'
export async function saveEnrollment(f: FormData) {
  const { error } = await supabase.rpc('admin_enroll', {
    p_user: f.get('user_id'),
    p_course: f.get('course_id'),
    p_cohort: f.get('cohort_id') || null,
    p_status: f.get('status'),
  })
  if (error) throw error
}
