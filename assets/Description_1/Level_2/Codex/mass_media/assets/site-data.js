window.MeridianData = (() => {
  const heroStory = {
    title: "Emergency Diplomacy Scrambles as Red Sea Shipping Routes Face New Pressure",
    dek: "World leaders are racing to contain a maritime crisis that could disrupt energy markets, food supply chains, and regional security calculations.",
    category: "World",
    byline: "By Hannah Vo",
    time: "Updated 18 minutes ago",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=80",
    caption: "Commercial vessels transit a strategic shipping corridor amid rising military alerts."
  };

  const homepageStories = [
    {
      title: "Inside the coalition talks reshaping Europe’s climate agenda",
      category: "Politics",
      byline: "By Marcus Levin",
      time: "1 hour ago",
      image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Chip export controls push Asian supply chains into a new phase",
      category: "Tech",
      byline: "By Priya Raman",
      time: "2 hours ago",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "A festival season shaped by climate anxiety and public art",
      category: "Culture",
      byline: "By Lena Scott",
      time: "3 hours ago",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Why public trust in local reporting is rising again",
      category: "Media",
      byline: "By Theo Hart",
      time: "4 hours ago",
      image: "https://images.unsplash.com/photo-1504711331083-9c895941bf81?auto=format&fit=crop&w=900&q=80"
    }
  ];

  const worldStories = [
    {
      title: "UN convenes emergency session as Red Sea tensions escalate",
      byline: "By Hannah Vo",
      time: "24 minutes ago",
      summary: "Diplomats are weighing maritime security guarantees while insurers and cargo operators recalculate exposure. The debate could determine whether key shipping routes remain viable this winter.",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "South Asian cities test extreme-heat warning networks",
      byline: "By Neha Kapoor",
      time: "58 minutes ago",
      summary: "Municipal leaders are pairing mobile alerts with neighborhood cooling hubs as seasonal heat begins arriving earlier each year.",
      image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "European finance ministers clash over industrial subsidies",
      byline: "By Marcus Levin",
      time: "1 hour ago",
      summary: "The latest dispute reveals how strategic competition with China and the U.S. is redrawing internal priorities in Brussels.",
      image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Flood recovery in Brazil exposes gaps in disaster insurance",
      byline: "By Sofia Mendes",
      time: "2 hours ago",
      summary: "Families rebuilding in southern states face a patchwork of public aid and rising private premiums.",
      image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Kenyan startups attract fresh climate-tech financing",
      byline: "By Daniel Otieno",
      time: "3 hours ago",
      summary: "Investors are backing battery storage, agricultural forecasting, and off-grid logistics tools.",
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Middle East ceasefire talks stall over inspection terms",
      byline: "By Hannah Vo",
      time: "4 hours ago",
      summary: "Negotiators remain divided over monitoring arrangements and the sequencing of humanitarian deliveries.",
      image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Migration routes through the Americas shift after policy changes",
      byline: "By Tomas Rivera",
      time: "5 hours ago",
      summary: "Aid groups say new checkpoints have reconfigured the geography of risk for families on the move.",
      image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=900&q=80"
    }
  ];

  const mostRead = [
    "The satellite economy’s quiet labor boom",
    "How students are reshaping campus political coalitions",
    "Why the streaming slowdown is changing prestige TV",
    "What a carbon border tax could mean for trade"
  ];

  const opinionWriters = [
    {
      name: "Amina Bell",
      title: "Columnist",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      headline: "The world cannot afford diplomacy designed for peacetime"
    },
    {
      name: "Julian Cross",
      title: "Technology Critic",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      headline: "AI policy is turning into a proxy war over labor"
    },
    {
      name: "Marisol Vega",
      title: "Culture Essayist",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      headline: "The slow return of civic optimism in public art"
    }
  ];

  const faq = [
    {
      q: "Can I cancel at any time?",
      a: "Yes. Monthly plans can be canceled at any time from your account page and remain active through the billing cycle."
    },
    {
      q: "Does All-Access include the mobile app?",
      a: "Yes. All-Access includes the Meridian app, audio articles, archives, and member-only newsletters."
    },
    {
      q: "Do students receive discounts?",
      a: "Student and educator pricing is available after verification with a valid academic email."
    }
  ];

  return { heroStory, homepageStories, worldStories, mostRead, opinionWriters, faq };
})();
