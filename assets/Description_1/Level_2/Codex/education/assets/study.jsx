function StudyPage() {
  const { modules } = window.LearnPathData;
  const [activeTab, setActiveTab] = useState("Overview");
  const [liveMessage, setLiveMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentLesson, setCurrentLesson] = useState({ module: 1, lesson: 3, title: "Functions and scope" });
  const lessonRefs = useRef([]);
  const completed = new Set(["Introduction to the Python workflow", "Working with notebooks", "Data types and expressions", "Lists and tuples", "Dictionaries"]);

  const nextLesson = () => {
    setBusy(true);
    window.setTimeout(() => {
      setCurrentLesson({ module: 2, lesson: 4, title: "Functions and scope" });
      setBusy(false);
      setLiveMessage("Advanced to the next lesson.");
      const nextNode = lessonRefs.current[5];
      if (nextNode) nextNode.focus();
    }, 600);
  };

  return (
    <PageLayout currentPage="study" liveMessage={liveMessage}>
      <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Lesson 4 of 12 - Module 2: Data Structures</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" aria-label="Course progress 33 percent complete">
          <div className="h-full w-1/3 rounded-full bg-emerald-500" />
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy={busy}>
        <div>
          <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="video-player-heading">
            <h1 id="video-player-heading" className="text-4xl font-semibold text-slate-950">{currentLesson.title}</h1>
            <div
              tabIndex="0"
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                  setLiveMessage("Video play or pause toggled.");
                }
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  setLiveMessage("Video seek adjusted.");
                }
              }}
              className="focus-ring mt-5 rounded-[1.5rem] bg-slate-950 p-8 text-white"
              aria-label="Lesson video player. Use Space to play or pause and arrow keys to seek."
            >
              <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[1.25rem] border border-white/10 bg-slate-900">
                <p className="text-xl font-semibold">Video Player Placeholder</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {["Play", "Pause", "Volume", "Fullscreen"].map((label) => (
                    <button key={label} type="button" className="focus-ring rounded-full border border-white/20 px-4 py-2 text-sm" aria-label={label}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={nextLesson} className="focus-ring mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" aria-label="Complete current lesson and advance">
              Mark Lesson Complete
            </button>
          </section>

          <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="lesson-tabs-heading">
            <h2 id="lesson-tabs-heading" className="text-3xl font-semibold text-slate-950">Lesson Materials</h2>
            <div role="tablist" aria-label="Study materials tabs" className="mt-5 flex flex-wrap gap-3">
              {["Overview", "Notes", "Q&A", "Resources"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className="tab-button focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              {activeTab === "Overview" && "This lesson introduces reusable functions, return values, and scope in real analysis workflows."}
              {activeTab === "Notes" && "Your notes sync here across devices. Pin important code patterns and examples for review."}
              {activeTab === "Q&A" && "Discuss common pitfalls with other learners and review instructor answers to lesson questions."}
              {activeTab === "Resources" && "Download the notebook, cheat sheet, and practice exercises for this lesson."}
            </div>
          </section>
        </div>

        <aside className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="lesson-sidebar-heading">
          <h2 id="lesson-sidebar-heading" className="text-3xl font-semibold text-slate-950">Lesson Sidebar</h2>
          <div className="mt-5 space-y-4">
            {modules.map((module, moduleIndex) => (
              <section key={module.name}>
                <h3 className="text-lg font-semibold text-slate-900">{module.name}</h3>
                <ul className="mt-3 space-y-2">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const done = completed.has(lesson);
                    const refIndex = moduleIndex * 3 + lessonIndex;
                    return (
                      <li key={lesson}>
                        <button
                          ref={(node) => { lessonRefs.current[refIndex] = node; }}
                          type="button"
                          aria-checked={done}
                          className="focus-ring flex w-full items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-3 text-left text-sm text-slate-700"
                          aria-label={`${lesson} - ${done ? "Completed" : "Not completed"}`}
                        >
                          <span>{lesson}</span>
                          <span aria-hidden="true">{done ? "✓" : ""}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </aside>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<StudyPage />);
