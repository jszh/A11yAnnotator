const { useEffect, useMemo, useRef, useState } = React;

function useFocusTrap(isOpen, containerRef, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;
    const node = containerRef.current;
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    const getFocusable = () => Array.from(node.querySelectorAll(selector));
    const previous = document.activeElement;

    window.requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable[0]) focusable[0].focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      const restore = triggerRef?.current || previous;
      if (restore && typeof restore.focus === "function") restore.focus();
    };
  }, [isOpen, containerRef, onClose, triggerRef]);
}

function EnrollModal({ isOpen, onClose, triggerRef, onConfirm }) {
  const modalRef = useRef(null);
  const [errors, setErrors] = useState({});
  useFocusTrap(isOpen, modalRef, onClose, triggerRef);
  if (!isOpen) return null;

  const submit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};
    if (!formData.get("fullName")?.trim()) nextErrors.fullName = "Enter your full name.";
    if (!formData.get("email")?.trim() || !String(formData.get("email")).includes("@")) nextErrors.email = "Enter a valid email address.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20">
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="enroll-modal-heading" className="panel w-full max-w-xl rounded-[2rem] border border-white/70 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="enroll-modal-heading" className="text-2xl font-semibold text-slate-950">Enroll in LearnPath</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Complete the quick sign-up to save your progress and access the full course experience.</p>
          </div>
          <button type="button" onClick={onClose} className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Close enrollment dialog">
            Close
          </button>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={submit} noValidate>
          <label className="text-sm font-medium text-slate-800">
            Full Name *
            <input
              name="fullName"
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              aria-required="true"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "enroll-name-error" : undefined}
            />
            {errors.fullName && <span id="enroll-name-error" className="mt-2 block text-sm text-rose-700">{errors.fullName}</span>}
          </label>
          <label className="text-sm font-medium text-slate-800">
            Email *
            <input
              name="email"
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "enroll-email-error" : undefined}
            />
            {errors.email && <span id="enroll-email-error" className="mt-2 block text-sm text-rose-700">{errors.email}</span>}
          </label>
          <button type="submit" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" aria-label="Complete course enrollment">
            Complete Enrollment
          </button>
        </form>
      </div>
    </div>
  );
}

function Header({ currentPage }) {
  const links = [
    { key: "home", label: "Home", href: "./index.html" },
    { key: "courses", label: "Courses", href: "./courses.html" },
    { key: "study", label: "Study", href: "./study.html" },
    { key: "pricing", label: "Pricing", href: "./pricing.html" },
    { key: "dashboard", label: "Dashboard", href: "./dashboard.html" }
  ];

  return (
    <>
      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 lg:px-8">
          <a href="./index.html" className="focus-ring rounded-full bg-slate-950 px-4 py-3 text-lg font-semibold text-white">LearnPath</a>
          <nav aria-label="Primary" className="ml-auto flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                aria-current={currentPage === link.key ? "page" : undefined}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${currentPage === link.key ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-xl font-semibold text-white">LearnPath</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Structured online learning for technology, business, design, and personal development.</p>
        </div>
        <nav aria-label="Footer learning">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./courses.html" className="focus-ring rounded">Browse courses</a></li>
            <li><a href="./pricing.html" className="focus-ring rounded">Plans</a></li>
            <li><a href="./dashboard.html" className="focus-ring rounded">Dashboard</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer support">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Learn</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./course.html" className="focus-ring rounded">Course detail</a></li>
            <li><a href="./study.html" className="focus-ring rounded">Study tools</a></li>
            <li><a href="./index.html" className="focus-ring rounded">Start free trial</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function CourseCard({ course, href = "./course.html" }) {
  return (
    <article className="panel rounded-[2rem] border border-white/70 p-4 shadow-sm">
      <img src={course.image} alt="" className="h-44 w-full rounded-[1.5rem] object-cover" />
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{course.category}</p>
        <h3 className="text-xl font-semibold text-slate-950">
          <a href={href} className="focus-ring rounded" aria-label={`${course.title} by ${course.instructor}`}>
            {course.title}
          </a>
        </h3>
        <p className="text-sm text-slate-600">{course.instructor}</p>
        <p className="text-sm text-slate-600">{course.rating} ★ · {course.duration}</p>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.level}</span>
          <span className="text-sm font-semibold text-slate-950">{course.price}</span>
        </div>
      </div>
    </article>
  );
}

function PageLayout({ currentPage, liveMessage, children }) {
  return (
    <div>
      <div className="sr-live" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      <Header currentPage={currentPage} />
      <main id="main-content" className="page-main mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
