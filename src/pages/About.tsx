import { ArrowLeft, BookOpen, Compass, Target } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { BottomCTA, FAQ, PageHeading } from '../components/Shared'

export default function About() {
  return (
    <>
      <PageHeading
        eyebrow="عن تفاصيل"
        title="في التفاصيل، يبدأ الفهم."
        description="مركز تفاصيل للتدريب. مساحة للتعلّم المنظم، وبناء المهارات، والاستعداد الواعي لاختبار القدرات."
      />
      <section className="container about-story page-content">
        <div className="about-brand-art">
          <img
            src="./brand/logo.webp"
            alt="الشعار الأصلي لمركز تفاصيل للتدريب"
            width="1280"
            height="1136"
          />
        </div>
        <div>
          <span className="eyebrow">فكرتنا</span>
          <h2>
            استعداد مبني على فهم،
            <br />
            وممارسة لها هدف.
          </h2>
          <p>
            نؤمن أن الاستعداد الجيد يبدأ بإدراك الفكرة، ثم تطبيقها ومراجعتها. لذلك تتمحور تجربة
            تفاصيل حول مهارات واضحة في الكمي واللفظي، وخطوات تدريب يمكن للمتدرب متابعتها.
          </p>
          <p>هدفنا أن تعرف لماذا اخترت الإجابة، وكيف تحسّن طريقتك في السؤال التالي.</p>
          <Link className="text-link" to="/programs">
            تعرّف على مسارات التعلّم <ArrowLeft size={20} />
          </Link>
        </div>
      </section>
      <section className="container about-values">
        <div>
          <Compass size={35} weight="duotone" />
          <h2>وضوح من البداية</h2>
          <p>تعرف ماذا ستتعلّم، ولماذا تحتاجه، وكيف تتدرب عليه.</p>
        </div>
        <div>
          <BookOpen size={35} weight="duotone" />
          <h2>فهم قبل التكرار</h2>
          <p>شرح يساعدك على استيعاب الفكرة وتطبيقها في سياق جديد.</p>
        </div>
        <div>
          <Target size={35} weight="duotone" />
          <h2>مراجعة لها معنى</h2>
          <p>كل خطأ يكشف مهارة تستحق مزيدًا من التدريب.</p>
        </div>
      </section>
      <section className="section container faq-section">
        <div>
          <h2>تفاصيل أوضح.</h2>
          <p>إجابات على ما قد تحتاج إلى معرفته قبل البداية.</p>
        </div>
        <FAQ />
      </section>
      <BottomCTA />
    </>
  )
}
