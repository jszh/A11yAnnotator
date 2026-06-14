(function () {
  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "services.html", label: "Services" },
    { href: "permits.html", label: "Permits & Licenses" },
    { href: "billing.html", label: "Pay a Bill" },
    { href: "about.html", label: "About" },
    { href: "contact.html", label: "Contact" }
  ];

  const serviceCategories = [
    {
      name: "Utilities & Billing",
      href: "billing.html",
      description: "Manage water, sewer, and solid waste billing accounts."
    },
    {
      name: "Permits & Licenses",
      href: "permits.html",
      description: "Apply for building, planning, and temporary use approvals."
    },
    {
      name: "Public Safety",
      href: "contact.html",
      description: "Connect with police, fire, emergency management, and preparedness resources."
    },
    {
      name: "Transportation",
      href: "services.html",
      description: "Review road closures, transit options, traffic projects, and parking services."
    },
    {
      name: "Parks & Recreation",
      href: "services.html",
      description: "Find facilities, recreation programs, trails, and seasonal events."
    },
    {
      name: "Social Services",
      href: "contact.html",
      description: "Locate housing support, youth programs, and senior assistance."
    }
  ];

  const leadership = [
    {
      name: "Elena Ramirez",
      title: "Mayor",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
      alt: "Mayor Elena Ramirez smiling in a navy blazer during an official portrait"
    },
    {
      name: "Marcus Lee",
      title: "Council President",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
      alt: "Council President Marcus Lee in a formal city hall portrait"
    },
    {
      name: "Tanya Brooks",
      title: "Council Member, Ward 2",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&q=80",
      alt: "Council Member Tanya Brooks in a professional headshot"
    },
    {
      name: "David Kim",
      title: "Council Member, Ward 4",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
      alt: "Council Member David Kim in a suit at city hall"
    }
  ];

  const newsItems = [
    {
      title: "Fall leaf collection routes begin October 14",
      text: "Residents can review route maps, bagging rules, and neighborhood pickup windows."
    },
    {
      title: "New small business grant portal opens next week",
      text: "The city will accept applications for storefront improvement and equipment grants."
    },
    {
      title: "City Council meeting recap now available",
      text: "Read highlights from the latest council session, including transportation updates."
    }
  ];

  const events = [
    { date: "Nov 12", title: "Veterans Day Ceremony", place: "Lakewood Civic Plaza" },
    { date: "Nov 18", title: "Parks Master Plan Open House", place: "Westside Community Center" },
    { date: "Nov 26", title: "Holiday Market Preview", place: "Downtown Commons" }
  ];

  function Header(props) {
    const React = window.React;
    const activePath = props.activePath;
    return React.createElement(
      "header",
      { className: "sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl" },
      React.createElement(
        "div",
        { className: "mx-auto max-w-7xl px-4 py-4 lg:px-6" },
        React.createElement(
          "div",
          { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
          React.createElement(
            "a",
            {
              href: "index.html",
              className: "inline-flex items-center gap-3 rounded-full text-slate-950 no-underline"
            },
            React.createElement(
              "span",
              { className: "inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white" },
              "L"
            ),
            React.createElement(
              "span",
              null,
              React.createElement("span", { className: "block text-xl font-extrabold tracking-tight" }, "City of Lakewood"),
              React.createElement("span", { className: "block text-sm text-slate-600" }, "Official Government Portal")
            )
          ),
          React.createElement(
            "div",
            { className: "flex flex-wrap items-center gap-3" },
            React.createElement(
              "a",
              {
                href: "services.html",
                className: "rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-50"
              },
              "Resident Services"
            ),
            React.createElement(
              "a",
              {
                href: "contact.html",
                className: "rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-slate-800"
              },
              "Contact Departments"
            )
          )
        ),
        React.createElement(
          "nav",
          { className: "mt-4 flex flex-wrap items-center gap-2", "aria-label": "Primary" },
          navLinks.map(function (link) {
            const isActive = link.href === activePath;
            return React.createElement(
              "a",
              {
                key: link.href,
                href: link.href,
                "aria-current": isActive ? "page" : undefined,
                className:
                  "rounded-full px-4 py-2 text-sm font-medium no-underline " +
                  (isActive
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950")
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
          React.createElement("h2", { className: "text-lg font-bold" }, "City of Lakewood"),
          React.createElement(
            "p",
            { className: "text-sm leading-6 text-slate-300" },
            "Serving approximately 160,000 residents with transparent, accessible public services."
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Popular"),
          ["Pay utility bill", "Apply for permits", "City events"].map(function (item) {
            return React.createElement("p", { key: item, className: "text-sm text-slate-200" }, item);
          })
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Visit"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "City Hall"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "480 Civic Center Drive"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "Lakewood, WA 98499")
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Hours"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "Mon-Thu: 8:00 AM to 5:30 PM"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "Fri: 8:00 AM to 12:00 PM"),
          React.createElement("p", { className: "text-sm text-slate-200" }, "Emergency services available 24/7")
        )
      ),
      React.createElement(
        "div",
        { className: "border-t border-slate-800 px-4 py-4 text-center text-sm text-slate-400" },
        "City of Lakewood official portal mockup for public service access."
      )
    );
  }

  window.LakewoodPortal = {
    navLinks: navLinks,
    serviceCategories: serviceCategories,
    leadership: leadership,
    newsItems: newsItems,
    events: events,
    Header: Header,
    Footer: Footer
  };
})();
