function CoursePage() {
  const { courses, modules, reviews } = window.LearnPathData;
  const course = courses.find((item) => item.id === "python-data-science");
  const [openModule, setOpenModule] = useState(modules[0].name);
  const [liveMessage, setLiveMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <PageLayout currentPage="courses" liveMessage={liveMessage}>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h1 className="text-5xl font-semibold text-slate-950">{course.title} - {course.level} · {course.duration}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{course.description}</p>

          <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="instructor-heading">
            <h2 id="instructor-heading" className="text-3xl font-semibold text-slate-950">Instructor</h2>
            <div className="mt-5 flex items-center gap-4">
              <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80" alt="Dr. Nina Park" className="h-16 w-16 rounded-full object-cover" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Dr. Nina Park</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Data scientist and university lecturer focused on applied analytics, experimentation, and curriculum design.</p>
              </div>
            </div>
          </section>

          <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="includes-heading">
            <h2 id="includes-heading" className="text-3xl font-semibold text-slate-950">Course Includes</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li>24 hours of video lectures</li>
              <li>Downloadable notebooks and resource packs</li>
              <li>Certificate of completion</li>
            </ul>
          </section>

          <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="text-3xl font-semibold text-slate-950">Curriculum</h2>
            <ul className="mt-5 space-y-3">
              {modules.map((module) => (
                <li key={module.name} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <button
                    type="button"
                    onClick={() => setOpenModule((current) => current === module.name ? "" : module.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpenModule((current) => current === module.name ? "" : module.name);
                      }
                    }}
                    aria-expanded={openModule === module.name}
                    className="accordion-button focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
                  >
                    <h3 className="text-xl font-semibold">{module.name}</h3>
                    <span aria-hidden="true">{openModule === module.name ? "−" : "+"}</span>
                  </button>
                  <ul hidden={openModule !== module.name} className="mt-4 space-y-2 px-4 text-sm text-slate-600">
                    {module.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-3xl font-semibold text-slate-950">Student Reviews</h2>
            <p className="mt-3 text-lg font-semibold text-slate-900">4.8 average rating</p>
            <div className="mt-5 space-y-4">
              {reviews.map((review) => (
                <article key={review.name} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{review.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{review.rating} ★</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{review.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="panel sticky top-28 h-fit rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <p className="text-3xl font-semibold text-slate-950">{course.price}</p>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setModalOpen(true)}
            className="focus-ring mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            aria-label={`Enroll in ${course.title}`}
          >
            Enroll Now
          </button>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>Intermediate pathway</p>
            <p>Certificate included</p>
            <p>Lifetime access</p>
          </div>
        </aside>
      </section>

      <EnrollModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        triggerRef={triggerRef}
        onConfirm={() => setLiveMessage(`Enrollment confirmed for ${course.title}.`)}
      />
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CoursePage />);
