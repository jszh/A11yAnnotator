window.LakewoodPortalData = (() => {
  const serviceCategories = [
    {
      id: "utilities",
      name: "Utilities & Billing",
      description: "Manage water, sewer, trash collection, and account services.",
      href: "./pay-bill.html"
    },
    {
      id: "permits",
      name: "Permits & Licenses",
      description: "Apply for building, event, business, and zoning permits online.",
      href: "./permits.html"
    },
    {
      id: "safety",
      name: "Public Safety",
      description: "Find emergency preparedness resources, police updates, and fire services.",
      href: "./services.html"
    },
    {
      id: "transportation",
      name: "Transportation",
      description: "Street maintenance, transit information, parking, and mobility services.",
      href: "./services.html"
    },
    {
      id: "parks",
      name: "Parks & Recreation",
      description: "Programs, facility rentals, trails, and park reservations.",
      href: "./services.html"
    },
    {
      id: "social",
      name: "Social Services",
      description: "Senior support, housing assistance, food access, and family services.",
      href: "./services.html"
    }
  ];

  const quickServices = [
    { name: "Pay a Bill", description: "Review your utility balance and submit a payment online.", href: "./pay-bill.html" },
    { name: "Report an Issue", description: "Notify the city about potholes, streetlight outages, or graffiti.", href: "./contact.html" },
    { name: "Apply for a Permit", description: "Start a permit application for construction, events, or signage.", href: "./permits.html" },
    { name: "Find a Park", description: "Browse parks, trails, playgrounds, and recreation amenities.", href: "./services.html" }
  ];

  const announcements = [
    {
      title: "Lakewood Launches Winter Warming Center Hours",
      date: "November 12",
      summary: "Extended evening hours are now available at the Civic Resource Center during severe weather alerts."
    },
    {
      title: "Council Approves 2025 Transportation Improvement Plan",
      date: "November 8",
      summary: "The adopted plan expands sidewalk repairs, traffic calming, and bus stop upgrades citywide."
    },
    {
      title: "Yard Waste Pickup Schedule Updated for Holidays",
      date: "November 3",
      summary: "Residents can review revised collection dates for Thanksgiving week and early December."
    }
  ];

  const events = [
    { title: "City Council Meeting", date: "Nov 18", details: "6:00 PM at City Hall Council Chambers" },
    { title: "Community Preparedness Workshop", date: "Nov 21", details: "5:30 PM at Lakewood Library Auditorium" },
    { title: "Parks Volunteer Cleanup", date: "Nov 23", details: "9:00 AM at Cedar Grove Park" }
  ];

  const leaders = [
    {
      name: "Elena Ramirez",
      title: "Mayor",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Marcus Lee",
      title: "Council President",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Danielle Brooks",
      title: "Council Member",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Samuel Ortiz",
      title: "Council Member",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const departments = [
    { name: "City Hall", phone: "(555) 010-2000", hours: "Mon-Fri, 8:00 AM-5:00 PM" },
    { name: "Utilities Billing", phone: "(555) 010-2015", hours: "Mon-Fri, 8:30 AM-4:30 PM" },
    { name: "Permits & Inspections", phone: "(555) 010-2040", hours: "Mon-Fri, 8:00 AM-4:30 PM" },
    { name: "Parks & Recreation", phone: "(555) 010-2088", hours: "Mon-Fri, 9:00 AM-5:00 PM" },
    { name: "Non-Emergency Public Safety", phone: "(555) 010-2110", hours: "24 hours" }
  ];

  return { serviceCategories, quickServices, announcements, events, leaders, departments };
})();
