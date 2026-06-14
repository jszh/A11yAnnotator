window.LearnPathData = (() => {
  const categories = [
    { name: "Web Development", href: "./courses.html" },
    { name: "Data Science", href: "./courses.html" },
    { name: "UX Design", href: "./courses.html" },
    { name: "Business", href: "./courses.html" },
    { name: "Photography", href: "./courses.html" }
  ];

  const courses = [
    {
      id: "python-data-science",
      title: "Python for Data Science",
      instructor: "Dr. Nina Park",
      rating: 4.8,
      enrolled: "84,200",
      price: "$49",
      category: "Data Science",
      level: "Intermediate",
      duration: "24 hours",
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
      description: "Use Python, pandas, and visualization workflows to analyze datasets and build job-ready projects."
    },
    {
      id: "react-foundations",
      title: "React Foundations",
      instructor: "Miguel Santos",
      rating: 4.7,
      enrolled: "126,000",
      price: "$39",
      category: "Web Development",
      level: "Beginner",
      duration: "18 hours",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
      description: "Learn components, state, routing, and modern frontend patterns in a project-driven format."
    },
    {
      id: "ux-research-lab",
      title: "UX Research Lab",
      instructor: "Emma Clarke",
      rating: 4.9,
      enrolled: "41,500",
      price: "$59",
      category: "UX Design",
      level: "Intermediate",
      duration: "16 hours",
      image: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=900&q=80",
      description: "Run interviews, synthesize findings, and build evidence-backed product recommendations."
    },
    {
      id: "business-storytelling",
      title: "Business Storytelling for Leaders",
      instructor: "Jordan Hale",
      rating: 4.6,
      enrolled: "53,700",
      price: "Free",
      category: "Business",
      level: "Beginner",
      duration: "8 hours",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
      description: "Communicate with clarity through strategy decks, pitches, and stakeholder storytelling."
    },
    {
      id: "portrait-photography",
      title: "Portrait Photography Essentials",
      instructor: "Lena Ortiz",
      rating: 4.5,
      enrolled: "29,300",
      price: "$29",
      category: "Photography",
      level: "Beginner",
      duration: "10 hours",
      image: "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=900&q=80",
      description: "Build confidence with camera settings, lighting, and composition for portraits."
    },
    {
      id: "ml-systems",
      title: "Machine Learning Systems",
      instructor: "Prof. Arjun Mehta",
      rating: 4.9,
      enrolled: "22,800",
      price: "$79",
      category: "Data Science",
      level: "Advanced",
      duration: "30 hours",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      description: "Go from prototype to production with feature stores, model monitoring, and evaluation pipelines."
    }
  ];

  const modules = [
    {
      name: "Module 1: Foundations",
      lessons: ["Introduction to the Python workflow", "Working with notebooks", "Data types and expressions"]
    },
    {
      name: "Module 2: Data Structures",
      lessons: ["Lists and tuples", "Dictionaries", "Loops and conditionals", "Functions and scope"]
    },
    {
      name: "Module 3: pandas in Practice",
      lessons: ["Reading CSVs", "Filtering and grouping", "Merging datasets"]
    },
    {
      name: "Module 4: Visualization",
      lessons: ["Matplotlib basics", "Seaborn for insight", "Telling data stories"]
    },
    {
      name: "Module 5: Final Project",
      lessons: ["Project brief", "Analysis workflow", "Final presentation"]
    }
  ];

  const reviews = [
    { name: "Priya S.", rating: 5, text: "Dense, practical, and clearly structured. The projects felt realistic without being overwhelming." },
    { name: "Kevin L.", rating: 4, text: "Loved the instructor pacing and the review notebooks. I would take the sequel immediately." }
  ];

  const dashboardCourses = [
    { title: "Python for Data Science", progress: 68, next: "Lesson 4: Data Structures", href: "./study.html" },
    { title: "React Foundations", progress: 34, next: "Lesson 2: Component Basics", href: "./study.html" }
  ];

  return { categories, courses, modules, reviews, dashboardCourses };
})();
