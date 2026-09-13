import { useEffect, useState } from 'react'
import { courses as editorialCourses, courseGroups } from '../data/course-catalog'
import type { Course } from '../data/course-catalog'
import { supabase } from './backend'
import type { CourseRecord } from './backend'
export type CatalogCourse = Course & { price: number | null; duration_hours: number | null }
const string = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const strings = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : fallback
export function catalogCourse(r: CourseRecord): CatalogCourse {
  const base = editorialCourses.find((c) => c.id === r.id),
    d = r.details || {},
    group = courseGroups.find((g) => g.id === r.group_id) || courseGroups[0]
  return {
    id: r.id,
    title: r.title,
    description: r.summary,
    category: group.title,
    groupId: group.id,
    level: r.level,
    short: string(d.short, base?.short || r.title),
    overview: string(d.overview, base?.overview || r.summary),
    audience: string(d.audience, base?.audience || 'للمهتمين بمجال الدورة.'),
    prerequisites: string(
      d.prerequisites,
      base?.prerequisites || 'تُراجع متطلبات الدورة مع المركز قبل تأكيد الحجز.',
    ),
    topics: strings(d.topics, base?.topics),
    outcomes: strings(d.outcomes, base?.outcomes),
    symbol: group.id,
    tone: base?.tone || 'blue',
    image: r.image_path || base?.image || `./images/courses/${group.image}.webp`,
    imageAlt: string(d.imageAlt, base?.imageAlt || `صورة تعريفية بمجال ${group.title}`),
    price: r.price,
    duration_hours: r.duration_hours,
  }
}
export function useCatalog() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false)
  useEffect(() => {
    let alive = true
    void supabase
      .from('courses')
      .select('*')
      .eq('status', 'active')
      .eq('is_listed', true)
      .order('sort_order')
      .order('created_at')
      .then(({ data, error }) => {
        if (!alive) return
        setError(!!error)
        setLoading(false)
        if (data) setCourses(data.map(catalogCourse))
      })
    return () => {
      alive = false
    }
  }, [])
  return { courses, loading, error }
}
