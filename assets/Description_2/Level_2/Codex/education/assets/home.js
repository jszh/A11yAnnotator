const { html, PageShell, courseCatalog, employerPartners, successStories, StatChip } = window.SkillForge;

function HomePage() {
  const featuredCourses = courseCatalog.slice(0, 3);

  return html`
    <${PageShell}
      eyebrow="Career-first learning"
      title="Your Next Career Starts Here"
      description="Earn industry-recognized certificates in as little as 8 weeks through instructor-led cohorts and self-paced pathways built for adult learners."
    >
      <section className="hero-mesh overflow-hidden rounded-[2rem] text-white shadow-2xl shadow-blue-200/60">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Credential-based momentum</p>
            <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight lg:text-6xl">Build a new path in healthcare, IT, trades, or business without pausing your life.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50 lg:text-lg">SkillForge blends live instruction, employer-reviewed assignments, and outcome coaching so career changers can move from exploration to enrollment to completion with confidence.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="./courses.html" className="focus-ring rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">Start Learning</a>
              <a href="./pricing.html" className="focus-ring rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white">Try Free</a>
              <a href="./dashboard.html" className="focus-ring rounded-full border border-blue-200/40 bg-blue-400/20 px-6 py-3 text-sm font-semibold text-white">Sign Up</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <${StatChip} label="Cohort starting March 3" value="4 seats left" tone="gold" />
              <${StatChip} label="Placement support" value="92% job placement" tone="mint" />
            </div>
          </div>
          <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/10 p-6">
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Find Your Path</p>
              <h3 className="mt-2 text-2xl font-semibold">2-minute career fit quiz</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Answer a few questions about your schedule, goals, and prior experience to get a recommended pathway.</p>
              <a href="./courses.html" className="focus-ring mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Find Your Path</a>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Employer partners</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                ${employerPartners.map((partner) => html`
                  <li key=${partner} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white">${partner}</li>
                `)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-courses" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-courses" className="text-3xl font-semibold text-slate-950">Learning discovery built around clear pathways</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Choose between cohort-based structure, live online training, and self-paced tracks with predictable credentials and start dates.</p>
          </div>
          <a href="./courses.html" className="focus-ring hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 lg:inline-flex">Browse all programs</a>
        </div>
        <div className="card-grid mt-8 grid gap-6 lg:grid-cols-3">
          ${featuredCourses.map((course) => html`
            <article key=${course.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <img src=${course.image} alt=${`${course.title} learning path preview`} className="h-52 w-full object-cover" />
              <div className="space-y-3 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">${course.field}</p>
                <h3 className="text-xl font-semibold text-slate-950">${course.title}</h3>
                <p className="text-sm text-slate-500">${course.format} · ${course.duration} · ${course.nextStart}</p>
                <p className="text-sm leading-6 text-slate-600">${course.summary}</p>
                <a href=${course.id === "medical-admin" ? "./course-detail.html" : "./courses.html"} className="focus-ring inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Start Learning
                </a>
              </div>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="stories-heading" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="stories-heading" className="text-3xl font-semibold text-slate-950">Success Stories</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Real before-and-after outcomes from adults who used SkillForge to switch careers and earn entry-level roles with confidence.</p>
          </div>
          <a href="./dashboard.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">See learner dashboard</a>
        </div>
        <div className="story-track mt-8 grid auto-cols-[minmax(280px,360px)] grid-flow-col gap-6 overflow-x-auto pb-4">
          ${successStories.map((story) => html`
            <article key=${story.name} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <img src=${story.image} alt=${`${story.name} learner portrait`} className="h-16 w-16 rounded-2xl object-cover" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">${story.name}</h3>
                  <p className="text-sm text-slate-500">${story.before} → ${story.after}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">"${story.quote}"</p>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="mt-16 grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 id="trust-heading" className="text-3xl font-semibold text-slate-950">Trust built into every step of the platform</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">SkillForge pairs institutional-grade structure with adult-learner flexibility: employer advisory partners, credential transparency, visible schedules, and weekly coaching checkpoints.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <${StatChip} label="Instructor-led cohorts" value="Weekly live labs" tone="blue" />
          <${StatChip} label="Career services" value="Resume + interview prep" tone="slate" />
          <${StatChip} label="Financing options" value="Monthly plans available" tone="mint" />
          <${StatChip} label="Support response" value="Advisor chat in minutes" tone="gold" />
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${HomePage} />`);
