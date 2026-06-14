(function () {
  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "courses.html", label: "Courses" },
    { href: "course.html", label: "Course Detail" },
    { href: "study.html", label: "Study" },
    { href: "pricing.html", label: "Pricing" },
    { href: "dashboard.html", label: "Dashboard" }
  ];

  const categories = [
    { name: "Web Development", desc: "Frontend, backend, APIs, and deployment workflows." },
    { name: "Data Science", desc: "Python, analytics, visualization, and machine learning basics." },
    { name: "UX Design", desc: "Research, interaction design, prototyping, and systems thinking." },
    { name: "Business", desc: "Leadership, strategy, communication, and team operations." },
    { name: "Photography", desc: "Composition, editing, visual storytelling, and gear skills." }
  ];

  const courses = [
    {
      title: "Python for Data Science",
      instructor: "Dr. Amara Singh",
      rating: 4.8,
      enrolled: "118K learners",
      price: "$39",
      duration: "24 hours",
      level: "Intermediate",
      category: "Data Science",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      alt: "Laptop displaying code and charts on a work desk"
    },
    {
      title: "Modern Web App Foundations",
      instructor: "Jordan Ellis",
      rating: 4.7,
      enrolled: "94K learners",
      price: "$29",
      duration: "18 hours",
      level: "Beginner",
      category: "Web Development",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      alt: "Developer workstation with code editor open across dual monitors"
    },
    {
      title: "UX Research in Practice",
      instructor: "Mina Alvarez",
      rating: 4.9,
      enrolled: "52K learners",
      price: "$35",
      duration: "14 hours",
      level: "Intermediate",
      category: "UX Design",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      alt: "Design team reviewing sticky notes and wireframes on a wall"
    },
    {
      title: "Strategic Communication for Managers",
      instructor: "Owen Carter",
      rating: 4.6,
      enrolled: "76K learners",
      price: "Free",
      duration: "9 hours",
      level: "Beginner",
      category: "Business",
      image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
      alt: "Professional team meeting around a conference table"
    },
    {
      title: "Visual Storytelling Through Photography",
      instructor: "Leah Mercer",
      rating: 4.7,
      enrolled: "41K learners",
      price: "$24",
      duration: "11 hours",
      level: "Advanced",
      category: "Photography",
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80",
      alt: "Photographer holding a camera during golden hour outdoors"
    },
    {
      title: "SQL and Data Analysis Essentials",
      instructor: "Noah Patel",
      rating: 4.8,
      enrolled: "88K learners",
      price: "$19",
      duration: "16 hours",
      level: "Beginner",
      category: "Data Science",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      alt: "Analytics dashboard and laptop screen showing charts and metrics"
    }
  ];

  const faq = [
    {
      q: "Can I switch plans later?",
      a: "Yes. You can move between Free, Pro, and Teams at any time from your account settings."
    },
    {
      q: "Do courses include certificates?",
      a: "Most structured courses include a completion certificate and downloadable learning record."
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Yes. Paid plans include a 14-day money-back guarantee on first purchase."
    }
  ];

  function Header(props) {
    const React = window.React;
    const activePath = props.activePath;
    return React.createElement(
      "header",
      { className: "sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl" },
      React.createElement(
        "div",
        { className: "mx-auto max-w-7xl px-4 py-4 lg:px-6" },
        React.createElement(
          "div",
          { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
          React.createElement(
            "a",
            { href: "index.html", className: "inline-flex items-center gap-3 rounded-full text-slate-950 no-underline" },
            React.createElement("span", { className: "inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-lg font-extrabold text-white" }, "L"),
            React.createElement(
              "span",
              null,
              React.createElement("span", { className: "block text-2xl font-extrabold tracking-tight" }, "LearnPath"),
              React.createElement("span", { className: "block text-sm text-slate-600" }, "Structured learning for modern careers")
            )
          ),
          React.createElement(
            "div",
            { className: "flex flex-wrap items-center gap-3" },
            React.createElement(
              "a",
              {
                href: "courses.html",
                className: "rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50"
              },
              "Browse Courses"
            ),
            React.createElement(
              "a",
              {
                href: "pricing.html",
                className: "rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-slate-800"
              },
              "Start Free Trial"
            )
          )
        ),
        React.createElement(
          "nav",
          { className: "mt-4 flex flex-wrap gap-2", "aria-label": "Primary" },
          navLinks.map(function (link) {
            return React.createElement(
              "a",
              {
                key: link.href,
                href: link.href,
                "aria-current": activePath === link.href ? "page" : undefined,
                className:
                  "nav-pill rounded-full px-4 py-2 text-sm font-semibold no-underline " +
                  (activePath === link.href ? "" : "bg-white text-slate-700 hover:bg-slate-100")
              },
              link.label
            );
          })
        )
      )
    );
  }

  function Footer() {
    const React = window.React;
    return React.createElement(
      "footer",
      { className: "mt-16 border-t border-slate-200 bg-slate-950 text-slate-100" },
      React.createElement(
        "div",
        { className: "mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-4 lg:px-6" },
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-xl font-bold" }, "LearnPath"),
          React.createElement("p", { className: "text-sm leading-7 text-slate-300" }, "Online learning pathways across technology, business, design, and personal growth.")
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Explore"),
          ["Courses", "Pricing", "Dashboard"].map(function (item) {
            return React.createElement("p", { key: item, className: "text-sm text-slate-200" }, item);
          })
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Trust"),
          ["Expert instructors", "Certificates", "2M+ global learners"].map(function (item) {
            return React.createElement("p", { key: item, className: "text-sm text-slate-200" }, item);
          })
        ),
        React.createElement(
          "form",
          { className: "space-y-3", "aria-label": "Email signup" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Stay updated"),
          React.createElement("label", { htmlFor: "footer-email", className: "sr-only" }, "Email address"),
          React.createElement("input", {
            id: "footer-email",
            type: "email",
            placeholder: "Email address",
            className: "w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400"
          }),
          React.createElement(
            "button",
            {
              type: "submit",
              className: "rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            },
            "Join Newsletter"
          )
        )
      )
    );
  }

  function CourseCard(props) {
    const React = window.React;
    const course = props.course;
    return React.createElement(
      "article",
      { className: "course-card page-surface overflow-hidden rounded-[1.5rem] transition" },
      React.createElement("img", { src: course.image, alt: course.alt, className: "h-48 w-full object-cover" }),
      React.createElement(
        "div",
        { className: "p-5" },
        React.createElement("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" }, course.category),
        React.createElement("h3", { className: "mt-2 text-2xl font-bold leading-tight text-slate-950" }, course.title),
        React.createElement("p", { className: "mt-2 text-sm text-slate-600" }, course.instructor),
        React.createElement(
          "div",
          { className: "mt-3 flex flex-wrap gap-3 text-sm text-slate-600" },
          React.createElement("span", null, course.rating.toFixed(1) + " ★"),
          React.createElement("span", null, course.duration),
          React.createElement("span", { className: "rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800" }, course.level)
        ),
        React.createElement(
          "div",
          { className: "mt-4 flex items-center justify-between gap-3" },
          React.createElement("span", { className: "text-lg font-extrabold text-slate-950" }, course.price),
          React.createElement(
            "a",
            {
              href: props.href || "course.html",
              className: "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-slate-800"
            },
            "View Course"
          )
        )
      )
    );
  }

  window.LearnPathShared = {
    navLinks: navLinks,
    categories: categories,
    courses: courses,
    faq: faq,
    Header: Header,
    Footer: Footer,
    CourseCard: CourseCard
  };
})();
