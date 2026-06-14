(function () {
  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "world.html", label: "World" },
    { href: "article.html", label: "Article" },
    { href: "opinion.html", label: "Opinion" },
    { href: "subscribe.html", label: "Subscribe" }
  ];

  const secondarySections = ["World", "Politics", "Tech", "Culture"];

  const topStories = [
    {
      title: "Regional powers recalibrate as Red Sea security enters a new phase",
      byline: "By Leila Hassan",
      summary: "Diplomats say the emergency session signals a broader effort to contain shipping disruptions before they reshape energy and trade routes.",
      image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=80",
      alt: "Large assembly hall with delegates seated for an international summit"
    },
    {
      title: "Election-year budgets are colliding with aging infrastructure demands",
      byline: "By Marcus Holt",
      summary: "State leaders are pitching restraint even as bridge repairs and flood defenses move from abstract risk to immediate cost."
    },
    {
      title: "Why generative AI regulation is moving from theory to municipal code",
      byline: "By Priya Banerjee",
      summary: "City procurement offices and school systems are becoming the first test beds for practical policy rules."
    },
    {
      title: "A new generation of filmmakers is rebuilding the political documentary",
      byline: "By Elena Scott",
      summary: "Smaller crews, sharper archives, and platform-native distribution are shifting how investigative stories reach audiences."
    }
  ];

  const worldStories = [
    {
      title: "Cease-fire diplomacy strains under maritime pressure campaign",
      byline: "Rania El-Sayed",
      time: "18 min ago",
      summary: "Envoys say the next 48 hours could determine whether shipping insurers widen restrictions across key routes.",
      image: "https://images.unsplash.com/photo-1518544866330-95a8f1cd6d50?auto=format&fit=crop&w=1200&q=80",
      alt: "Cargo ships moving through a narrow sea passage at sunset"
    },
    {
      title: "European ministers debate emergency energy reserve thresholds",
      byline: "Jonas Weber",
      time: "44 min ago",
      summary: "Officials remain divided over whether a coordinated reserve release would calm markets or deepen longer-term exposure.",
      image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
      alt: "Nighttime skyline with government buildings lit against the sky"
    },
    {
      title: "Flood recovery tests local governments across the Americas",
      byline: "Marisol Vega",
      time: "1 hr ago",
      summary: "Mayors are asking for flexible funding as emergency housing costs outpace national relief formulas.",
      image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
      alt: "Flooded street with responders moving through water"
    },
    {
      title: "Africa’s urban growth corridors draw new manufacturing bets",
      byline: "Kojo Mensah",
      time: "2 hrs ago",
      summary: "Investors are following labor force growth, but planners warn that transport bottlenecks could undercut the boom.",
      image: "https://images.unsplash.com/photo-1484318571209-661cf29a69c3?auto=format&fit=crop&w=1200&q=80",
      alt: "Busy city avenue lined with tall buildings and traffic"
    },
    {
      title: "Asia-Pacific negotiators return to talks on fisheries enforcement",
      byline: "Naomi Kwan",
      time: "3 hrs ago",
      summary: "The latest round centers on satellite data sharing and port inspection standards.",
      image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
      alt: "Coastal waters with boats near a harbor at dawn"
    },
    {
      title: "Aid agencies warn of logistics bottlenecks at regional crossings",
      byline: "Thomas Reid",
      time: "5 hrs ago",
      summary: "Delays in processing and transport are beginning to alter where emergency stocks can be positioned.",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80",
      alt: "Border crossing area with trucks queued along a road"
    },
    {
      title: "Latin American central banks hold steady despite political noise",
      byline: "Camila Duarte",
      time: "7 hrs ago",
      summary: "Markets reacted cautiously as policymakers stressed the need to preserve inflation credibility.",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      alt: "Global map visualization projected on a dark wall"
    }
  ];

  const opinionWriters = [
    {
      name: "Nadia Ellison",
      role: "Columnist, Global Affairs",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      alt: "Portrait of columnist Nadia Ellison"
    },
    {
      name: "Micah Sterling",
      role: "Columnist, Politics",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      alt: "Portrait of columnist Micah Sterling"
    },
    {
      name: "Ari Park",
      role: "Columnist, Culture",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      alt: "Portrait of columnist Ari Park"
    }
  ];

  const faq = [
    {
      q: "Can I cancel anytime?",
      a: "Yes. Digital and All-Access plans can be cancelled at any time from your account settings."
    },
    {
      q: "Does the Free tier include newsletters?",
      a: "Yes. Free members can sign up for selected newsletters and access a limited number of stories each month."
    },
    {
      q: "What is included in All-Access?",
      a: "All-Access includes full digital access, the mobile app, audio articles, event invitations, and member-only essays."
    }
  ];

  function Header(props) {
    const React = window.React;
    const activePath = props.activePath;
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "div",
        { className: "border-b border-red-200 bg-red-50", role: "status", "aria-live": "polite" },
        React.createElement(
          "div",
          { className: "mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm text-red-900 lg:flex-row lg:items-center lg:px-6" },
          React.createElement("span", { className: "font-bold uppercase tracking-[0.18em]" }, "Breaking"),
          React.createElement("span", null, "UN Emergency Session Called Over Red Sea Tensions")
        )
      ),
      React.createElement(
        "header",
        { className: "border-b border-slate-200 bg-white/95 backdrop-blur-xl" },
        React.createElement(
          "div",
          { className: "mx-auto max-w-7xl px-4 py-5 lg:px-6" },
          React.createElement(
            "div",
            { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" },
            React.createElement(
              "a",
              { href: "index.html", className: "text-slate-950 no-underline" },
              React.createElement("p", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-slate-500" }, "Independent Digital News"),
              React.createElement("h1", { className: "serif-head text-4xl font-bold tracking-tight" }, "The Meridian")
            ),
            React.createElement(
              "div",
              { className: "flex flex-wrap items-center gap-3" },
              React.createElement(
                "a",
                {
                  href: "subscribe.html",
                  className: "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-slate-800"
                },
                "Subscribe"
              ),
              React.createElement(
                "a",
                {
                  href: "opinion.html",
                  className: "rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50"
                },
                "Opinion"
              )
            )
          ),
          React.createElement(
            "nav",
            { className: "mt-5 flex flex-wrap gap-2", "aria-label": "Primary" },
            navLinks.map(function (link) {
              return React.createElement(
                "a",
                {
                  key: link.href,
                  href: link.href,
                  "aria-current": activePath === link.href ? "page" : undefined,
                  className:
                    "rounded-full px-4 py-2 text-sm font-semibold no-underline " +
                    (activePath === link.href ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-100")
                },
                link.label
              );
            })
          )
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
        { className: "mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:px-6" },
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "serif-head text-2xl font-bold" }, "The Meridian"),
          React.createElement(
            "p",
            { className: "text-sm leading-7 text-slate-300" },
            "Independent reporting on global affairs, politics, technology, and culture."
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Sections"),
          secondarySections.map(function (section) {
            return React.createElement("p", { key: section, className: "text-sm text-slate-200" }, section);
          })
        ),
        React.createElement(
          "form",
          { className: "space-y-3", "aria-label": "Newsletter signup" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Newsletter"),
          React.createElement("label", { className: "sr-only", htmlFor: "newsletter-email" }, "Email address"),
          React.createElement("input", {
            id: "newsletter-email",
            type: "email",
            placeholder: "Email address",
            className: "w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400"
          }),
          React.createElement(
            "button",
            {
              type: "submit",
              className: "rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800"
            },
            "Sign Up"
          )
        )
      )
    );
  }

  function StoryCard(props) {
    const React = window.React;
    const story = props.story;
    return React.createElement(
      "article",
      { className: "story-card page-surface overflow-hidden rounded-[1.5rem] transition" },
      story.image
        ? React.createElement("img", { src: story.image, alt: story.alt, className: "h-56 w-full object-cover" })
        : null,
      React.createElement(
        "div",
        { className: "p-5" },
        React.createElement("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" }, props.kicker || "Analysis"),
        React.createElement("h3", { className: "mt-2 text-2xl font-bold leading-tight text-slate-950" }, story.title),
        React.createElement("p", { className: "mt-3 text-sm font-medium text-slate-600" }, story.byline),
        story.summary
          ? React.createElement("p", { className: "mt-3 text-sm leading-7 text-slate-700" }, story.summary)
          : null,
        React.createElement(
          "a",
          {
            href: props.href || "article.html",
            className: "mt-4 inline-flex text-sm font-semibold text-red-800 no-underline hover:text-red-900"
          },
          "Read story"
        )
      )
    );
  }

  window.MeridianShared = {
    navLinks: navLinks,
    secondarySections: secondarySections,
    topStories: topStories,
    worldStories: worldStories,
    opinionWriters: opinionWriters,
    faq: faq,
    Header: Header,
    Footer: Footer,
    StoryCard: StoryCard
  };
})();
