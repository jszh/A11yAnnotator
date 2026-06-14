const { useEffect, useRef, useState } = React;
const { html, PageShell, ProgressTag, classroomLessons, announce } = window.SkillForge;

function ClassroomPage() {
  const [activeLesson, setActiveLesson] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [position, setPosition] = useState(318);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState(classroomLessons);
  const lessonRefs = useRef([]);

  const currentLesson = lessons[activeLesson];
  const duration = 900;

  useEffect(() => {
    if (!loading && lessonRefs.current[activeLesson]) {
      lessonRefs.current[activeLesson].focus();
    }
  }, [activeLesson, loading]);

  const togglePlayback = () => {
    setIsPlaying((current) => {
      const next = !current;
      announce(next ? "Lesson playing." : "Lesson paused.");
      return next;
    });
  };

  const seek = (delta) => {
    setPosition((current) => {
      const next = Math.max(0, Math.min(duration, current + delta));
      announce(`Lesson position ${Math.floor(next / 60)} minutes ${next % 60} seconds.`);
      return next;
    });
  };

  const onPlayerKeyDown = (event) => {
    if (event.key === " ") {
      event.preventDefault();
      togglePlayback();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seek(15);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seek(-15);
    }
  };

  const completeAndAdvance = () => {
    setLoading(true);
    announce(`${currentLesson.title} marked complete. Loading next lesson.`);
    window.setTimeout(() => {
      setLessons((current) => current.map((lesson, index) => index === activeLesson ? { ...lesson, completed: true } : lesson));
      const nextIndex = Math.min(activeLesson + 1, lessons.length - 1);
      setActiveLesson(nextIndex);
      setLoading(false);
    }, 500);
  };

  return html`
    <${PageShell}
      eyebrow="Cohort classroom"
      title="Week 3 of 8 — Medical Billing Fundamentals"
      description="Follow the weekly agenda, join your next live session, submit assignments, and collaborate with your cohort from one structured workspace."
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section aria-labelledby="lesson-player-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Live learning tool</p>
                <h2 id="lesson-player-heading" className="mt-2 text-3xl font-semibold text-slate-950">${currentLesson.title}</h2>
              </div>
              <${ProgressTag} value="Progress 43%" label="Course progress 43 percent complete" />
            </div>
            <div
              className="video-stage focus-ring mt-6 rounded-[1.75rem] bg-slate-950 p-6 text-white"
              tabIndex="0"
              role="group"
              aria-label="Lesson video player"
              onKeyDown=${onPlayerKeyDown}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Simulated session</p>
                  <p className="mt-3 max-w-2xl text-lg text-slate-100">Review claims status workflows, payer follow-up scripts, and denial prevention steps before the live Q&A.</p>
                </div>
                <div>
                  <div className="mb-4 h-2 rounded-full bg-white/20">
                    <div className="h-2 rounded-full bg-blue-400" style=${{ width: `${(position / duration) * 100}%` }}></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="focus-ring rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" aria-label=${isPlaying ? "Pause lesson video" : "Play lesson video"} onClick=${togglePlayback}>
                      ${isPlaying ? "Pause" : "Play"}
                    </button>
                    <button type="button" className="focus-ring rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white" aria-label="Lower volume" onClick=${() => setVolume((current) => Math.max(0, current - 10))}>Volume</button>
                    <button type="button" className="focus-ring rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white" aria-label="Enter fullscreen lesson player" onClick=${() => announce("Fullscreen view is not available in this mockup.")}>Fullscreen</button>
                    <p className="text-sm text-blue-100">Use Space to play or pause, left and right arrows to seek.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">Volume: ${volume}%</div>
          </section>

          <section aria-labelledby="agenda-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="agenda-heading" className="text-3xl font-semibold text-slate-950">Weekly agenda</h2>
              <div className="grid grid-cols-3 gap-3">
                ${[
                  { label: "Days", value: "02" },
                  { label: "Hours", value: "14" },
                  { label: "Minutes", value: "26" },
                ].map((item) => html`
                  <div key=${item.label} className="countdown-digit rounded-3xl bg-slate-950 px-4 py-3 text-center text-white">
                    <p className="text-2xl font-semibold">${item.value}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">${item.label}</p>
                  </div>
                `)}
              </div>
            </div>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              <li className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">Tuesday live demo: claims workflow walk-through</li>
              <li className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">Thursday peer review: denial prevention checklist</li>
              <li className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">Saturday office hours: instructor feedback sprint</li>
              <li className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-700">Sunday checkpoint: quiz and reflection</li>
            </ul>
          </section>

          <section aria-labelledby="assignments-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="assignments-heading" className="text-3xl font-semibold text-slate-950">Assignment submission portal</h2>
            <form className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-950">
                Assignment title
                <input type="text" className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-normal" aria-required="true" />
              </label>
              <label className="text-sm font-semibold text-slate-950">
                Upload notes
                <input type="file" className="focus-ring mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-normal" aria-required="true" />
              </label>
              <label className="md:col-span-2 text-sm font-semibold text-slate-950">
                Reflection
                <textarea className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-normal" rows="4"></textarea>
              </label>
              <button type="button" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick=${() => announce("Assignment draft saved.")}>Save Draft</button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="discussion-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="discussion-heading" className="text-3xl font-semibold text-slate-950">Peer discussion board</h2>
            <div className="mt-5 space-y-4">
              <article className="rounded-[1.5rem] bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">Module 3 prompt</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Which claim denial scenario felt most realistic to your target role, and how would you prevent it?</p>
              </article>
              <article className="rounded-[1.5rem] bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">Peer reply highlight</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Jordan shared a payer escalation template that reduced missing information errors in a mock front desk workflow.</p>
              </article>
            </div>
          </section>

          <section aria-labelledby="resources-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="resources-heading" className="text-3xl font-semibold text-slate-950">Resource library</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li><a href="./classroom.html" className="focus-ring rounded text-blue-700 underline">Week 3 slides deck</a></li>
              <li><a href="./classroom.html" className="focus-ring rounded text-blue-700 underline">Claims worksheet PDF</a></li>
              <li><a href="./classroom.html" className="focus-ring rounded text-blue-700 underline">Reading links for payer terminology</a></li>
            </ul>
          </section>

          <section aria-labelledby="lesson-list-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="lesson-list-heading" className="text-3xl font-semibold text-slate-950">Lesson queue</h2>
              <button type="button" className="focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick=${completeAndAdvance}>Complete lesson</button>
            </div>
            <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900" aria-label="Week 3 of 8 progress badge">Week 3 of 8 — Medical Billing Fundamentals</div>
            <div aria-busy=${loading} className="mt-5">
              <ul className="lesson-list space-y-3">
                ${lessons.map((lesson, index) => html`
                  <li key=${lesson.id}>
                    <button
                      ref=${(node) => { lessonRefs.current[index] = node; }}
                      type="button"
                      role="checkbox"
                      className="focus-ring flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-4 text-left"
                      aria-current=${activeLesson === index ? "true" : undefined}
                      aria-checked=${lesson.completed}
                      aria-label=${`${lesson.title} — ${lesson.completed ? "Completed" : "In progress"}`}
                      onClick=${() => setActiveLesson(index)}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-950">${lesson.title}</span>
                        <span className="block text-sm text-slate-500">${lesson.duration}</span>
                      </span>
                      <span className=${`inline-flex h-8 w-8 items-center justify-center rounded-full ${lesson.completed ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-500"}`} aria-hidden="true">
                        ${lesson.completed ? "✓" : index + 1}
                      </span>
                    </button>
                  </li>
                `)}
              </ul>
            </div>
          </section>
        </div>
      </div>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${ClassroomPage} />`);
