import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  DownloadSimple,
  Notebook,
  PencilLine,
} from '@phosphor-icons/react'
import { PageHeading } from '../components/Shared'
import { articles, weekPlan } from '../data/content'
import { arNumber, downloadText } from '../services/learning'

export default function Library() {
  const { id } = useParams()
  const [filter, setFilter] = useState('الكل')
  const article = articles.find((a) => a.id === id)
  if (id && !article)
    return (
      <div className="container error-page">
        <h1>المقال غير موجود</h1>
        <Link to="/library" className="button">
          العودة للمكتبة <ArrowLeft />
        </Link>
      </div>
    )
  if (article)
    return (
      <article className="article-page container page-content">
        <Link to="/library" className="text-link back-link">
          <ArrowRight size={18} />
          مكتبة التعلّم
        </Link>
        <div className="article-meta">
          <span className="tag">{article.category}</span>
          <span>
            <Clock size={17} />
            {arNumber(article.minutes)} دقائق قراءة
          </span>
        </div>
        <h1>{article.title}</h1>
        <p className="article-intro">{article.intro}</p>
        <div className="article-cover">
          <BookOpen size={75} weight="light" />
          <span>
            لأن الفهم
            <br />
            يبدأ بالتفاصيل.
          </span>
        </div>
        <div className="article-body">
          {article.sections.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
        </div>
        <div className="article-end">
          <h2>حوّل الفكرة إلى تطبيق.</h2>
          <Link to="/practice" className="button">
            جرّب التدريب <ArrowLeft size={19} />
          </Link>
        </div>
      </article>
    )
  const filtered = articles.filter((a) => filter === 'الكل' || a.category === filter)
  return (
    <>
      <PageHeading
        eyebrow="مكتبة التعلّم"
        title="فكرة تفيدك. وخطوة تطبّقها."
        description="أدلة قصيرة تساعدك على تنظيم المذاكرة وفهم أخطائك وتطوير طريقة الحل."
      />
      <section className="container page-content">
        <div className="library-download">
          <div className="download-visual">
            <Notebook size={76} weight="light" />
          </div>
          <div>
            <span className="eyebrow">من القراءة إلى التطبيق</span>
            <h2>أسبوع أوضح، بخطة مكتوبة.</h2>
            <p>خطة موزعة بين الكمي واللفظي والمراجعة. عدّلها لتناسب وقتك.</p>
          </div>
          <button
            className="button button-outline"
            onClick={() =>
              downloadText(
                'خطة-مذاكرة-القدرات.txt',
                'مركز تفاصيل للتدريب\nخطة أسبوعية مقترحة\n\n' +
                  weekPlan.map((d) => `${d.day} | ${d.title}\n${d.detail}`).join('\n\n'),
              )
            }
          >
            <DownloadSimple size={21} />
            تحميل الخطة <span className="file-type">TXT</span>
          </button>
        </div>
        <div className="filter-tabs library-filters" role="group" aria-label="تصفية المقالات">
          {['الكل', ...new Set(articles.map((a) => a.category))].map((f) => (
            <button
              key={f}
              className={filter === f ? 'selected' : ''}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f === 'الكل' ? 'جميع المقالات' : f}
            </button>
          ))}
        </div>
        <div className="library-grid">
          {filtered.map((a) => (
            <Link key={a.id} to={`/library/${a.id}`} className={`article-card article-${a.id}`}>
              <div className="article-art">
                {a.id === 'study-plan' ? (
                  <Notebook size={67} weight="light" />
                ) : a.id === 'error-log' ? (
                  <PencilLine size={67} weight="light" />
                ) : (
                  <BookOpen size={67} weight="light" />
                )}
              </div>
              <div className="article-card-body">
                <div className="article-meta">
                  <span>{a.category}</span>
                  <span>
                    <Clock size={16} />
                    {arNumber(a.minutes)} دقائق
                  </span>
                </div>
                <h2>{a.title}</h2>
                <p>{a.intro}</p>
                <span className="text-link">
                  اقرأ الدليل <ArrowLeft size={19} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
