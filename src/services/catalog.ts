import { useEffect, useState } from 'react'
import { courses as editorialCourses } from '../data/content'
import type { Course } from '../data/content'
import { supabase } from './backend'
import type { CourseRecord } from './backend'
export type CatalogCourse = Course & { price: number | null; duration_hours: number | null }
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
      .order('created_at')
      .then(({ data, error }) => {
        if (!alive) return
        setError(!!error)
        setLoading(false)
        if (data)
          setCourses(
            data.map((r: CourseRecord) => {
              const base = editorialCourses.find((c) => c.id === r.id)
              return {
                ...(base || {
                  short: r.title,
                  topics: [],
                  outcomes: [],
                  symbol:
                    r.category === 'كمي' ? 'math' : r.category === 'لفظي' ? 'verbal' : 'compass',
                  tone: r.category === 'لفظي' ? 'sand' : 'blue',
                }),
                id: r.id,
                title: r.title,
                description: r.summary,
                category: r.category as Course['category'],
                level: r.level,
                price: r.price,
                duration_hours: r.duration_hours,
              } as CatalogCourse
            }),
          )
      })
    return () => {
      alive = false
    }
  }, [])
  return { courses, loading, error }
}
