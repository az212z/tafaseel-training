import { useState } from 'react'
import { MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react'
import { CourseCard, PageHeading } from '../components/Shared'
import { courses } from '../data/content'
import { arNumber } from '../services/learning'

export default function Programs() {
  const [category, setCategory] = useState('الكل')
  const [search, setSearch] = useState('')
  const filtered = courses.filter(
    (c) =>
      (category === 'الكل' || c.category === category) &&
      `${c.title} ${c.description} ${c.topics.join(' ')}`.includes(search.trim()),
  )
  return (
    <>
      <PageHeading
        eyebrow="البرامج التدريبية"
        title="مسار يناسب بدايتك وطموحك."
        description="تأسيس متدرج، وتدريب مركز، ومراجعة هادفة. اكتشف محتوى كل مسار واختر ما تحتاجه."
      />
      <section className="container page-content">
        <div className="filter-bar">
          <div className="filter-tabs" role="group" aria-label="تصفية البرامج حسب المسار">
            {['الكل', 'شامل', 'كمي', 'لفظي'].map((item) => (
              <button
                key={item}
                className={category === item ? 'selected' : ''}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item === 'الكل'
                  ? 'جميع البرامج'
                  : item === 'شامل'
                    ? 'كمي ولفظي'
                    : `القدرات ${item}`}
              </button>
            ))}
          </div>
          <label className="search-input">
            <MagnifyingGlass size={20} />
            <input
              aria-label="ابحث عن برنامج أو مهارة"
              placeholder="ابحث عن برنامج أو مهارة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="results-label" aria-live="polite">
          <SlidersHorizontal size={17} />
          {arNumber(filtered.length)} مسارات تدريبية
        </div>
        <h2 className="sr-only">المسارات المتاحة</h2>
        {filtered.length ? (
          <div className="programs-grid">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MagnifyingGlass size={40} />
            <h2>لم نجد مسارًا بهذا الوصف</h2>
            <p>جرّب كلمة أقصر أو اعرض جميع البرامج.</p>
            <button
              className="button button-outline"
              onClick={() => {
                setSearch('')
                setCategory('الكل')
              }}
            >
              عرض جميع البرامج
            </button>
          </div>
        )}
        <div className="editorial-note">
          المسارات المعروضة تصور للمحتوى التدريبي. تُعلن المواعيد والرسوم بعد اعتماد البرامج من
          المركز.
        </div>
      </section>
    </>
  )
}
